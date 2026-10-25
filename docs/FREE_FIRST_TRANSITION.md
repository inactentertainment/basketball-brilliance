# Basketball Brilliance — Free-first coach/player pilot

## Product decisions (2026-10-25)
- Public training, library and interactive tools are free without an account.
- Coach, player and parent accounts (when safe and operational) are free: no paid subscriptions or checkout.
- Do not collect newsletter/marketing emails or show promotional signup popups.
- Keep team/roster/invitations/assignments/progress in scope. Do not disable account authentication or convert shared data to browser-only localStorage.
- Do not publish paid-price or Stripe sandbox checkout UI. Retain code in Git history during migration.
- Existing Supabase client and SQL migrations remain untouched. Do not disconnect or delete projects before exporting database/schema/config and verifying restore.

## Verified current implementation
- Backend config currently points to Supabase, with configured=true. Availability of the backend and actual cross-account workflows is NOT verified.
- assets/js/bb-auth.js contains authentication and membership-role resolution.
- assets/js/bb-data.js contains team, membership, roster, invitation and related data helpers.
- The index contains three paid pricing/checkout offers and a subscription modal; these are hidden in this pilot branch only.

## Release gates before publishing
1. Audit every paid link, checkbox, offer modal, membership-access guard and legal text for inaccurate subscription claims; replace authorization paywalls with secure, free-role access where appropriate (never bypass security).
2. Resolve free account onboarding, adult/guardian approvals and youth privacy model before allowing minors to submit data.
3. Test coach creates team, saves roster, invites player, player accepts invite, coach assigns play, player completes it, coach sees persisted progress from another device. Use real isolated test accounts; no fake success claims.
4. Test signed-out / wrong-team users cannot access roster, assignments or progress; confirm Row Level Security and database constraints.
5. Confirm whether Supabase free-tier pausing meets expected service reliability; choose and test any replacement rather than merely swapping database clients.
6. Verify full mobile and desktop UI, links, offline behavior, backup/restore, error handling and permissions.
7. Review and update privacy, child safety, retention and terms; verify no marketing email collection. Authentication invitations/recovery emails are operational notices.
8. Merge only after tests pass. Current live main branch remains unchanged.

## Session 3 — Free account implementation (2026-10-25)

Code saved only to `feature/free-coach-platform-2026`:
- `bb-auth.js`: resolve verified primary roles and active team membership rather than paid subscription entitlements. Do not treat this UI role selection as RLS authorization.
- `bb-billing.js`: no Stripe checkout, paid plan links or payment redirects. Compatibility facade remains for old callsites; original sandbox implementation preserved in Git history/archive.
- `index.html`: free-account calls to action, player tool wording, account-status language, and hidden legacy subscription modals. Coach, Player and Parent portal code retained.
- `tests/account-flow.test.cjs`: replace obsolete Stripe checkout tests with free-access/role checks and retain session cleanup tests.
- `.github/workflows/free-access-qa.yml`: run npm tests and JS syntax checks on changes, no deployment permissions.

Verification: GitHub Actions run 40239266852 succeeded, including `npm ci`, `npm test` and JS syntax checks. Static review confirms the main role resolver no longer queries paid `memberships`, and active team membership can be read under existing self/coach RLS.

Not verified: actual Supabase project connectivity, migration state, 2+ real isolated accounts, adult/guardian approval workflow for minors, cross-device roster/assignment/progress persistence, and production browser behavior. Keep PR #4 as DRAFT until those checks pass. No public deploy or main branch merge authorized by this note.
