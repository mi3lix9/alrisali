# 09: Reminders for Prayer Times and Imsak

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** The domain Reminder planner produces local notifications for a rolling window; the app schedules them with expo-notifications, applying per-Salah minutes-before, sound, mute, voice and disable, Imsak, quiet hours and Message Style (Classic/Modern copy), topped up on launch, resume and settings change, capped at 64 on iOS.

**Blocked by:** 04 (Prayer Times timetable and next-Salah countdown)

**Status:** ready-for-agent

- [x] Domain tests: window, 64 cap, precedence of mute/voice/disable, quiet hours, time zone change (`packages/domain/src/reminders/planner.test.ts`, plus DST and the schedule diff; settings persistence in `packages/db-user/src/reminders/repository.test.ts`)
- [ ] Notifications fire offline at the right local time on device — pending simulator verification (needs a dev-client build with expo-notifications and the bundled sounds; scheduling uses DATE triggers at the Prayer Time instants, so nothing needs the network)
- [x] Message Style changes notification copy (Classic: rotating saying + source; Modern: coaching line; the copy is in each request's fingerprint, so a style change reschedules; on-device look pending simulator verification)
- [x] Settings change reschedules immediately (the root `ReminderScheduler` re-plans whenever Believer or Reminder settings data changes, and on every foreground; the diff cancels/reschedules only what changed)
