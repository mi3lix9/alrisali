# 04: Prayer Times timetable and next-Salah countdown

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** The domain Prayer Times calculation (Ja'fari default; Sunni, Hanafi, Ibadi; Maghrib fallback; Imsak minutes; Midnight) with real time zones, shown on the Prayer tab as today's timetable with Hidden Prayer Times, 12/24h format, location from GPS or city search, refresh on resume, and a next-Salah countdown on Home.

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings)

**Status:** done — pending simulator verification

- [x] Domain tests: known-good times for fixed cities/dates per method, DST day, high-latitude Maghrib fallback (`packages/domain/src/shared/prayer-times.test.ts`: Qatif, Najaf, Karbala, London per method against api.aladhan.com within a minute; London spring-forward and fall-back days; Reykjavik midsummer Ja'fari Maghrib → Sunset; Fajr/Isha/Imsak/Midnight null where the sun never reaches the angle; Imsak minutes; Midnight on the next date)
- [x] Changing method or location updates the timetable immediately, offline (timetable and countdown compute on the device from the `["user-data", "believer-settings"]` query, which every settings save invalidates; the per-user DB is local; method/location/Imsak/time-format persistence tested in `believer-settings.test.ts`. On-device look pending simulator verification)
- [x] Hidden Prayer Times respected by timetable and countdown (`nextPrayerTime`/`currentPrayerTime` take the hidden list, tested; the timetable lists only shown times; persistence tested in `db-user/src/prayer-times/repository.test.ts`)
- [ ] Location refreshes on app resume after moving — built (`useFollowDeviceLocation`: on launch and each foreground, a GPS-followed location is replaced after a ≥ 1 km move, never prompting; a searched or typed location stays put). Pending simulator verification: needs a native build with the new `expo-location` module (Simulator › Features › Location to move)
