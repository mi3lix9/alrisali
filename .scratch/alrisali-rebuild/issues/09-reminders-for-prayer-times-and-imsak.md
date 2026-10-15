# 09: Reminders for Prayer Times and Imsak

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** The domain Reminder planner produces local notifications for a rolling window; the app schedules them with expo-notifications, applying per-Salah minutes-before, sound, mute, voice and disable, Imsak, quiet hours and Message Style (Classic/Modern copy), topped up on launch, resume and settings change, capped at 64 on iOS.

**Blocked by:** 04 (Prayer Times timetable and next-Salah countdown)

**Status:** ready-for-agent

- [ ] Domain tests: window, 64 cap, precedence of mute/voice/disable, quiet hours, time zone change
- [ ] Notifications fire offline at the right local time on device
- [ ] Message Style changes notification copy
- [ ] Settings change reschedules immediately
