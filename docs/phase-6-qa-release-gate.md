# Basketball Brilliance — Phase 6 QA and release gate
Date: 2026-10-18
Branch: `feature/playlab-animation`
Status: **NOT PRODUCTION-READY**. This report records source-level checks; browser/device and authenticated integration tests remain unexecuted.

## Confirmed source-level checks
- Existing `index.html` remains unchanged on the development branch.
- Existing Coach Play Lab references `BBData.saveCoachPlay` and `BBData.listCoachPlays`.
- New isolated editor supports frame animation, dragging, ball handler, JSON import/export, local playbook imports, and demo assignment.
- Player preview reads demo assignments from the same-origin browser localStorage key `bb-playlab-player-assignment-v1`.
- Library preview uses the same assignment key and editor import key `bb-playlab-editor-import-v1`.
- Preview data does **not** use authenticated Supabase accounts or real team membership checks.
- Existing Coach/Player/Parent navigation has not been modified.
- Legacy markers are normalized into an initial animation frame only in the isolated editor; live database migration has not been tested.

## Release-blocking work
1. **Authentication and authorization:** Design and implement per-team coach-to-player assignments in Supabase with row-level security; only authorized team coaches can create or modify assignments; players can only read their own assignments; minors require applicable guardian-consent safeguards.
2. **Persistent learning records:** Define and implement per-player per-play progress and mastery records. Current preview scores are in-memory only, reset on stage changes, and can count repeated answers; do not treat these as validated mastery.
3. **Existing play preservation:** Test loading all supported legacy saved diagrams and ensure a reversible conversion path. Never overwrite original markers without verified migration and rollback.
4. **Practice Planner integration:** The library currently exports a text practice outline, not a saved item in the existing live Practice Planner. Implement and test the actual link before advertising it as connected.
5. **Deployment preview:** A GitHub branch file URL is source code, not a hosted browser preview. Set up a separate test deployment or local static server before usability sign-off.
6. **Device and accessibility QA:** Run real browser tests on Android Chrome, iOS Safari, and desktop Chrome/Firefox; test drag, tap, zoom, keyboard alternatives, reduced motion, screen reader labels, overflow, and no-data states.
7. **Security and reliability:** Validate imported JSON limits, untrusted content handling, localStorage quota failures, unauthorized requests, cross-account isolation, and playback interruption.
8. **Release sign-off:** Obtain explicit user approval before merging to `main` or changing production Supabase schema/data.

## Manual acceptance checklist
- [ ] Coach signs in and creates a play without losing existing diagrams.
- [ ] Coach saves an animated play and assigns it to one selected team player.
- [ ] Assigned player sees the play in their authenticated Player Portal.
- [ ] Another player cannot see the assignment.
- [ ] Player completes Watch, Learn, Practice, Predict, Master with reliable results.
- [ ] Coach sees the correct player's progress and completion.
- [ ] Coach sends a play into the actual existing Practice Planner.
- [ ] Legacy plays open and save without losing markers or descriptions.
- [ ] Parent portal, membership gates, checkout, and account session isolation still work.
- [ ] Mobile landscape/portrait and touch dragging pass on physical devices.
- [ ] Full keyboard and accessible alternative to drag interactions pass.
- [ ] Preview URL tested independently; production stays unchanged.
- [ ] Rollback procedure validated from backup branch.
- [ ] User explicitly approves release.

## Suggested production data model (proposal, not applied)
- `playlab_animations`: id, team_id, coach_id, title, description, schema_version, steps_json, legacy_play_id, timestamps.
- `playlab_assignments`: id, team_id, play_id, player_id, assigned_by, due_at, timestamps.
- `playlab_progress`: assignment_id, player_id, stage, attempt_count, score, completed_at, timestamps.
- Add foreign keys, unique constraints, membership checks, row-level security, and tests. Avoid storing sensitive youth data in browser-local demonstration keys.

## Explicit non-goals of this commit
No deployment, no database migration, no membership change, no edit to existing `index.html`, no assertion that browser QA passed.
