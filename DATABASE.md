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

## 6. RPC: `get_leaderboard`

Returns per-user aggregates needed to compute points on the client.
The weather warrior multiplier is applied in the app (`src/lib/constants.ts`)
so changing it never requires a database migration.

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
  left join public.commutes c on c.user_id = p.id
  left join public.transport_modes tm on tm.id = c.transport_mode_id
  group by p.id, p.display_name, p.discriminator;
$$;

-- Allow authenticated users to call this function
grant execute on function public.get_leaderboard() to authenticated;
grant execute on function public.get_next_discriminator(text) to authenticated;
```

---

## 7. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Find these in your Supabase project under **Settings → API**.

---

## 8. Auth settings (Supabase Dashboard)

- **Authentication → Providers → Email**: ensure Email provider is enabled.
- Optionally disable "Confirm email" for local development so you can sign up immediately without checking email.

---

## GitHub Pages deployment note

When deploying to GitHub Pages, update `vite.config.ts` to set the `base` to your repo name:

```ts
base: '/your-repo-name/',
```

The app uses `HashRouter` so all client-side routing works without server configuration.
