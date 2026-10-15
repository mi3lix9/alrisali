# 17: Announcements via Expo Push

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Admins write Announcements in Arabic and English, save drafts, schedule, publish now, duplicate, target an audience and send a test; devices register push tokens and receive them in the Believer's language, with an in-app inbox and an opt-out.

**Blocked by:** 09 (Reminders for Prayer Times and Imsak), 13 (Admin web foundation and content replica)

**Status:** done — pending env: EAS_PROJECT_ID, EXPO_ACCESS_TOKEN; pending simulator verification

- [x] Scheduler publishes due Announcements (server test with fake push transport)
- [x] Audience and language selection honoured
- [x] Dead tokens pruned
- [x] Inbox lists received Announcements; opt-out stops delivery
- [ ] Live delivery through Expo Push to a device: pending env: EAS_PROJECT_ID (push tokens), EXPO_ACCESS_TOKEN (only if push security is on); pending simulator/device verification of the native inbox, opt-out and tap-to-open
