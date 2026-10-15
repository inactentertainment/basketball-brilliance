# Basketball Brilliance — Build 61 verification

Date: October 15, 2026. Live site: https://basketballbrilliance.net/?build=61

## What was fixed

- Deferred account-state subscribers until Supabase releases its auth lock. Article and Player Next Move refreshes previously made API calls from those callbacks.
- Kept sign-out local to the current browser session. Account switching clears loaded records, selected team, checkout state, and cached dashboard state. Stale workspace requests cannot apply after a switch.
- Made membership labels respect expiration dates.
- Added checkout preflight, duplicate-purchase protection, server-backed access checks, and a return/recheck flow. A success URL never grants membership.
- Added mobile account form sizing, 44px controls, 16px inputs and keyboard-safe dialog height. These are implementation and DOM checks, not a completed visual phone test.
- Restricted the installed-app worker to public, same-origin static assets. Account, Stripe and external API requests bypass its cache. The v61 cache clears earlier versions.

## Verification evidence

| Area | Result | Scope |
|---|---|---|
| Coach, Player and Parent password sign-in | PASS | Actual Supabase Auth requests for the three existing owner test accounts |
| Account role and complimentary membership | PASS | Each account sees its matching active membership, through October 13, 2027 |
| Cross-account membership isolation | PASS | Each account cannot read another test account's membership |
| Member article notes | PASS | Each account created, updated and deleted a temporary note through its authenticated REST session |
| Session refresh and local sign-out | PASS | Refresh works before sign-out; the signed-out test session cannot refresh afterward |
| Unauthenticated membership access | PASS | No membership records returned |
| Unpaid and expired article access | PASS | Transactional database tests: writes denied; owned historical notes remain readable/deletable; cross-owner and anonymous access denied; transaction rolled back |
| Checkout and webhook logic | PASS locally | Fixtures cover all three plans, exact yearly prices, signatures, stale events, unpaid sessions, cancellation, duplicate purchase and false success links |
| Mobile rendering / device walkthrough | NOT VERIFIED | No supported browser QA capability in this workspace; no screenshots or actual touch/keyboard walkthrough claimed |
| Actual Stripe checkout → webhook → membership | BLOCKED | Deployed webhook reports missing test key and signing secret; no real charge or completed Stripe test purchase was made |

No passwords, access tokens or Stripe secrets are stored in this report or the test suite. Temporary API test notes were deleted and test sessions signed out. Existing owner memberships were not changed. Tests never write paid status to those accounts.

## Exact activation blocker

The deployed endpoint reports:

- `mode`: `sandbox`
- `checks.testKey`: `false`
- `checks.signingSecret`: `false`
- `checks.serviceAccess`: `true`

The missing configuration is `STRIPE_TEST_SECRET_KEY` and `STRIPE_WEBHOOK_SIGNING_SECRET` in the Basketball Brilliance project's Edge Function secrets:
https://supabase.com/dashboard/project/pwmdwxhsahnkeojniudd/functions/secrets

Stripe event destination:
https://pwmdwxhsahnkeojniudd.supabase.co/functions/v1/stripe-webhook

The current implementation deliberately accepts sandbox events only. Connecting live links alone will not enable live fulfillment. Keep annual prices Coach $47, Parent $24 and Player $17. Coach-linked basic family access remains separate from optional paid memberships.

## Next acceptance steps

1. Configure the two Stripe sandbox secrets and the signed Stripe event destination. Confirm the public endpoint reports `configured: true`.
2. Complete a no-charge Stripe test checkout for each plan using isolated unpaid test accounts, not the owner's complimentary memberships. Verify subscription, matching role, active status, return flow, refresh persistence, cancellation and replay behavior in the actual provider/database connection.
3. Run the mobile checklist below on an actual phone, including the installed app.
4. Configure and test live fulfillment separately before taking real membership payments. Youth enrollment remains unavailable pending the existing guardian-verification work.

## Mobile acceptance checklist (pending actual device execution)

- Entry: Install App at upper right; no navigation menu; choose Coach, Player or Parent.
- Each role: logo and role left; jukebox, three-line menu and installation action right; no overlap or horizontal page drift.
- Menu: every section link navigates, Close/Escape works, and focus returns to the trigger.
- Sign-in: select the matching role, choose **18 or older**, enter the test account and tap the orange **Sign In** button. Open the keyboard and confirm the inputs and submit controls remain reachable.
- Switch: **Sign Out / Switch Account**, then sign in to the next role. Confirm previous records and selected team are cleared.
- Jukebox: four choices, Playlist disclosure, Basketball Brilliance Tunes; play/pause/stop, back, close and local playlist save.
- Gallery: age filters, row arrows, swipe, video open/close and source fallback.
- Article: thin orange Reading & Comfort Bar, white icons, readable menus, theme/text/focus settings and read-aloud pause/stop.
- Membership: an active test account is told it is already active. An unpaid account is blocked while activation setup is incomplete. **Check membership access** reads database status and never treats URL text as proof of payment.

## Re-run local checks

```
npm ci
npm test
```

The automated suite is saved in `tests/`. It uses only local fixtures and does not submit payments, create users or contain account credentials.
