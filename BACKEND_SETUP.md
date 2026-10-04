# Basketball Brilliance — Backend Setup

Build 1 backend foundation is prepared for Supabase.

## Files
- `supabase/migrations/001_foundation.sql` — auth/profile trigger, roles, teams, players, family links, invites, memberships, coach data tables, RLS policies.
- `assets/js/bb-config.js` — project URL/publishable key placeholder.
- `assets/js/bb-auth.js` — signup, sign-in, sign-out, reset password, session/profile handling.
- `assets/js/bb-data.js` — organization/team/player/invite/membership data helpers.

## Activation steps
1. Create a dedicated Supabase project named **Basketball Brilliance**.
2. Apply `001_foundation.sql`.
3. Put the project API URL and publishable key into `assets/js/bb-config.js` and set `configured: true`.
4. Add the GitHub Pages URL to Supabase Auth redirect URLs:
   - https://inactentertainment.github.io/basketball-brilliance/
5. Test Coach, Player, and Parent account creation and RLS isolation.

The live site keeps preview/local behavior until the dedicated Supabase project is connected, so this foundation does not break the current build.
