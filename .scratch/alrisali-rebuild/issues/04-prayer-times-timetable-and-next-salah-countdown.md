# 04: Prayer Times timetable and next-Salah countdown

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** The domain Prayer Times calculation (Ja'fari default; Sunni, Hanafi, Ibadi; Maghrib fallback; Imsak minutes; Midnight) with real time zones, shown on the Prayer tab as today's timetable with Hidden Prayer Times, 12/24h format, location from GPS or city search, refresh on resume, and a next-Salah countdown on Home.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings)

**Status:** ready-for-agent

- [ ] Domain tests: known-good times for fixed cities/dates per method, DST day, high-latitude Maghrib fallback
- [ ] Changing method or location updates the timetable immediately, offline
- [ ] Hidden Prayer Times respected by timetable and countdown
- [ ] Location refreshes on app resume after moving
