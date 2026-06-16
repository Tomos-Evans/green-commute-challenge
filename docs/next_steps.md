# Next steps — Groups feature

Code for multi-group membership + group-scoped leaderboard & waves is implemented
(see `docs/DATABASE.md` for schema, full plan in conversation history). Build passes.
Not yet run against a live Supabase project.

## To do before this is usable

1. **Run the new SQL** from `docs/DATABASE.md` against the Supabase SQL editor, in order:
   - Section 8 "Groups" (`groups`, `user_groups`, `my_groups` view, `join_group_by_pin` RPC)
   - Section 9 "Waves become per-group" (drops old global-wave trigger/column, adds
     `group_id`/`start_date` to `waves`, new per-group unique-active index)
   - Updated `get_leaderboard(p_group_id)` function (also in section 9)
2. **Create test groups** via the Supabase dashboard (`groups` table): at least two,
   each with a distinct `join_pin`.
3. **Create a wave per group** in the `waves` table — different `start_date`/`finish_date`
   per group, `is_active = true` — to verify wave scoping actually differs per group.
4. **Manual test pass** (see Verification section of the original plan):
   - Sign up with a group PIN, confirm membership created
   - Join a second group from the Profile page
   - Switch groups on the Leaderboard dropdown — confirm rows/points and the header
     wave countdown change correctly, and disappear for "Global"
   - Log a commute and confirm it's correctly included/excluded per group based on
     `commute_date` vs. that group's wave window
   - Test the `#/join?pin=...` link both logged out (signup/login prompt) and logged in
     (auto-join) — this is the flow intended for a QR code on the bike shed
   - Confirm an invalid PIN shows a friendly error without crashing
5. **Generate the actual QR code/link** for the bike shed once a real group + PIN exist
   (`https://<site>/#/join?pin=<PIN>`).

## Known non-blocking issue

`npm run lint` reports `react-hooks/set-state-in-effect` on the new effects in
`Layout.tsx`, `GroupContext.tsx`, and `LeaderboardPage.tsx`. This is a pre-existing
false positive already present on `main` (same rule already fires on the original
`LeaderboardPage.tsx` and `AuthContext.tsx` before any of this work) — not a regression,
but worth revisiting if the lint config is ever tightened/enforced in CI.
