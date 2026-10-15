# 38: Mood Check-in and Remedy

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Believers record a mood (happy, calm, sad, stressed, angry) and receive a Remedy.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings)

**Status:** done — pending simulator verification

- [x] Mood Check-ins persist and sync — `mood_check_ins` table (uuid ids, additive migration) + `createMoodCheckInRepository` in `@alrisali/db-user/mood`; persistence across relaunch tested at seam 2; two-device push/pull verified by hand against a local `tursodb --sync-server` (Node binding). On Turso Cloud a Guest's check-in reaches the Believer's Cloud database after sign-in (`apps/server/src/turso-cloud.live.test.ts`)
- [x] Remedy shown per mood in both languages — 4 Remedies per mood in ar/en with sources in `@alrisali/domain/mood` (from the old app's duaRemedies + getSayingForMood themes); `MoodCheckInCard` exported from `@/features/mood` shows today's Remedy in the launch language. Visual check pending simulator verification
