# Supabase Database Setup

Run the SQL blocks below in the **Supabase SQL Editor** (Dashboard → SQL Editor → New query).

---

## 1. Enable UUID extension

```sql
create extension if not exists "pgcrypto";
```

---

## 2. Create `transport_modes` table

```sql
create table public.transport_modes (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  emoji                     text,
  points_per_mile           float not null,
  weather_warrior_eligible  boolean not null default false
);

-- Transport modes are public reference data — allow anon and authenticated to read.
-- This is needed because the signup page shows the dropdown before the user is logged in.
alter table public.transport_modes enable row level security;

create policy "Anyone can read transport modes"
  on public.transport_modes for select
  to anon, authenticated
  using (true);
```

`weather_warrior_eligible` controls whether the Weather Warrior toggle appears on the Log Journey page for that mode — only modes where the commuter is actually exposed to the weather (walking, cycling, e-bike) should be `true`. Modes where you're sheltered (public transport, car/EV) should be `false`.

### Seed transport modes

```sql
insert into public.transport_modes (name, emoji, points_per_mile, weather_warrior_eligible) values
  ('Walking',          '🚶', 3,   true),
  ('Cycling',          '🚴', 2,   true),
  ('E-Bike/E-Scooter', '🛵', 1.5, true),
  ('Public Transport', '🚌', 1,   false),
  ('EV / Car-Share',   '⚡', 0.5, false);
```

### Migration — if you already created the table

```sql
alter table public.transport_modes
  add column weather_warrior_eligible boolean not null default false;

update public.transport_modes set weather_warrior_eligible = true
  where name in ('Walking', 'Cycling', 'E-Bike/E-Scooter');
```

---

## 3. Create `profiles` table

```sql
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  display_name           text not null,
  discriminator          integer not null,
  normal_commute_mode_id uuid references public.transport_modes(id),
  created_at             timestamptz default now(),

  constraint profiles_display_name_discriminator_key unique (display_name, discriminator)
);

alter table public.profiles enable row level security;

-- Anyone logged in can read all profiles (needed for leaderboard display names)
create policy "Authenticated users can read all profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);
```

---

## 4. Create `commutes` table

```sql
create table public.commutes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  transport_mode_id uuid not null references public.transport_modes(id),
  distance_miles    float not null,
  commute_date      date not null,
  weather_warrior   boolean not null default false,
  created_at        timestamptz default now()
);

alter table public.commutes enable row level security;

-- Users can only access their own commutes
create policy "Users can read own commutes"
  on public.commutes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own commutes"
  on public.commutes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own commutes"
  on public.commutes for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own commutes"
  on public.commutes for delete
  to authenticated
  using (auth.uid() = user_id);
```

---

## 5. RPC: `get_next_discriminator`

Atomically assigns the next discriminator number for a given display name.

```sql
create or replace function public.get_next_discriminator(base_name text)
returns integer
language sql
security definer
as $$
  select coalesce(max(discriminator), 0) + 1
  from public.profiles
  where display_name = base_name;
$$;
```

---

## 6. Create `waves` table

Waves are fixed-length competition periods. They are created and toggled
**only from the Supabase dashboard** — the web app never writes to this
table, it only reads the currently active wave.

```sql
create table public.waves (
  id          uuid primary key default gen_random_uuid(),
  finish_date date not null,
  is_active   boolean not null default false
);

-- Enforce at most one active wave at a time
create unique index waves_single_active_idx
  on public.waves (is_active)
  where (is_active = true);

alter table public.waves enable row level security;

-- Read-only from the app; waves are created/edited via the Supabase dashboard
create policy "Authenticated users can read waves"
  on public.waves for select
  to authenticated
  using (true);
```

`finish_date` is the last inclusive day of the wave, entered as a calendar
date in US Eastern time (e.g. `2026-06-30`). To start a new wave: insert a
row with the desired `finish_date`, then set `is_active = true` (and set
any previously active wave's `is_active` back to `false` first — the
unique index above prevents two active waves at once).

### Add `wave_id` to `commutes` + auto-assignment trigger

```sql
alter table public.commutes
  add column wave_id uuid references public.waves(id);

create or replace function public.set_commute_wave_id()
returns trigger
language plpgsql
as $$
begin
  if new.wave_id is null then
    select id into new.wave_id from public.waves where is_active = true limit 1;
  end if;
  return new;
end;
$$;

create trigger commutes_set_wave_id
  before insert on public.commutes
  for each row execute function public.set_commute_wave_id();
```

This stamps every new commute with whichever wave is active at insert
time (or leaves `wave_id` `null` if no wave is active). The app never sets
`wave_id` itself.

---

## 7. RPC: `get_leaderboard`

Returns per-user aggregates needed to compute points on the client.
The weather warrior multiplier is applied in the app (`src/lib/constants.ts`)
so changing it never requires a database migration.

When a wave is active, totals are scoped to commutes logged during that
wave; when no wave is active, totals are all-time (unchanged behavior).

```sql
create or replace function public.get_leaderboard()
returns table (
  user_id                    uuid,
  display_name               text,
  discriminator              integer,
  total_non_warrior_points   float,
  total_warrior_base_points  float,
  total_miles                float,
  journey_count              bigint,
  warrior_commute_count      bigint
)
language sql
security definer
as $$
  with active_wave as (
    select id from public.waves where is_active = true limit 1
  )
  select
    p.id                                                                  as user_id,
    p.display_name,
    p.discriminator,
    coalesce(sum(c.distance_miles * tm.points_per_mile)
      filter (where c.weather_warrior = false), 0)                       as total_non_warrior_points,
    coalesce(sum(c.distance_miles * tm.points_per_mile)
      filter (where c.weather_warrior = true), 0)                        as total_warrior_base_points,
    coalesce(sum(c.distance_miles), 0)                                   as total_miles,
    count(c.id)                                                           as journey_count,
    count(c.id) filter (where c.weather_warrior = true)                  as warrior_commute_count
  from public.profiles p
  left join public.commutes c
    on c.user_id = p.id
   and (
     (select id from active_wave) is null
     or c.wave_id = (select id from active_wave)
   )
  left join public.transport_modes tm on tm.id = c.transport_mode_id
  group by p.id, p.display_name, p.discriminator
  having (select id from active_wave) is null or count(c.id) > 0;
$$;

-- Allow authenticated users to call this function
grant execute on function public.get_leaderboard() to authenticated;
grant execute on function public.get_next_discriminator(text) to authenticated;
```

---

## 8. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Find these in your Supabase project under **Settings → API**.

---

## 9. Auth settings (Supabase Dashboard)

- **Authentication → Providers → Email**: ensure Email provider is enabled.
- Optionally disable "Confirm email" for local development so you can sign up immediately without checking email.

---

## GitHub Pages deployment

The repo includes `.github/workflows/deploy.yml`, which builds and deploys the site to GitHub Pages automatically on every push to `main`.

Before it will work:

1. **Settings → Pages → Source**: set to **GitHub Actions**.
2. **Settings → Secrets and variables → Actions**: add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as your local `.env`) — the workflow injects them at build time.

`vite.config.ts` sets `base: '/green-commute-challenge/'` to match the GitHub Pages URL path. Update this if the repo is ever renamed.

The app uses `HashRouter` so all client-side routing works without server configuration.
