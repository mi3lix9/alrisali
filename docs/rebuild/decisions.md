# Rebuild decisions (agreed 2026-10-15)

Vocabulary: `GLOSSARY.md`. Architectural decisions: `docs/adr/`. Feature inventory of the old app: `docs/rebuild/inventory-*.md`.

## Scope

- Platforms: iOS and Android (Expo), plus a single web app with the public landing page and `/admin`.
- Every feature in the inventory is ported in the first release, the Prayer Assistant included. Every module is redesigned during the build from Panel UI and native patterns; there is no Figma.
- Unfinished features to finish: the Last-Read Ayah, Companion XP, Nahj al-Balagha, and Tasbih targets, export and notes.
- Dropped: Feed, the old surah list page, the EPUB placeholder.
- No migration from the old Postgres: everyone starts fresh.
- Free app; code is MIT-licensed, and content keeps its own licences.

## Architecture

- Fat client, thin server. Each Believer has their own database (ADR-0001), Guests included (ADR-0002).
- Three kinds of database:
  - Per-user Turso database, synced with the device.
  - Shared content database: Turso, read-only on the device, pulled with a read-only token.
  - Server database: Turso. Holds auth, push tokens, Contact Messages and usage analytics.
- Database lifecycle: the server creates a Believer's database on their first sign-in (Platform API, one group, named after the user id). Short-lived tokens scoped to that one database are minted through an oRPC route. Deleting an account destroys the database. Signing out wipes the device.
- Schema rule for synced tables: additive only, with a `schema_version` row; the app runs its bundled migrations before pushing.
- Reminders are scheduled on the device with expo-notifications; the server only sends Announcements, through Expo Push (ADR-0003).
  - Each Salah and Imsak has one rule: on/off, minutes before (0–60, default 5; Imsak 0), a tone (system, chime, bell), silent, and the Adhan voice. Precedence: disabled, then silent, then voice, then tone. New Believers get Fajr, Dhuhr and Maghrib on; Asr, Isha and Imsak start off, matching the timetable's hidden defaults (joined prayers, fasting days only).
  - The window is 14 days from today, capped at the 64 soonest (iOS's pending limit; Android uses the same cap). It is diffed against what is scheduled on launch, on every foreground and on any settings change. Fire times are instants of the location's Prayer Times; days and quiet hours follow the device's current time zone.
  - Quiet hours hold back only non-essential Reminders; Salah and Imsak Reminders are essential. Habit Reminders (ticket 34) join through the planner's `sources` input.
  - Message Style is a Believer setting (default Classic). Classic Reminders carry a rotating Qur'an or hadith saying with its source; Modern ones carry a short coaching line.
  - The Adhan voice is a 27-second CC BY-SA 3.0 recording from Wikimedia Commons, credited in Sources & Credits; the chime and bell tones are synthesised for the app.
- Quran: bundle KFGQPC Hafs v30 (text, page and line spans for each ayah, the font, and the PDF used to work out where each line breaks), from qurancomplex.gov.sa/quran-dev. Hafs only. Page Mode (horizontal swipe or vertical scroll, as a user setting) and Surah Mode (one Surah per screen, ending in a "Next Surah" button). Both modes share the Last-Read Ayah. Recitation streams straight to the device from alquran.cloud (Islamic Network), and from EveryAyah.com for reciters alquran.cloud lacks; the reciter list is bundled, no key or server is involved, and played files are cached for at most 7 days (ADR-0004).
- Books (Mafatih, Sahifa, Nahj): bundled static data with stable Supplication ids. The content database refers to Supplications by those ids. Arabic and English texts are re-sourced from Thaqalayn (CC BY 4.0).
- Tasbih feedback mode is a Believer setting (`tasbih_settings`, synced): sound and haptic, haptic only (default), or silent, for Tasbih al-Zahra and every Open Tasbih. The tap, step and round sounds are synthesised for the app, preloaded, and mix with other audio.

## Stack

| Area | Choice |
| --- | --- |
| Scaffold | Better-T-Stack, then adjusted |
| Monorepo | bun workspaces + Turborepo |
| Native | Expo SDK 58, dev client (not Expo Go), New Architecture |
| Native shells | expo-router: native tabs, stack and modals; `@expo/ui` (SwiftUI/Compose) for sheets, pickers and switches |
| Native screens | Panel UI (`panelui-native`) on Uniwind + Tailwind v4 |
| Device database | `@tursodatabase/sync-react-native` + `drizzle-orm/sqlite-proxy`; TanStack Query invalidated after local writes and after a `pull()` that brought changes. Must pass the spike; fallback is expo-sqlite with our own outbox sync |
| Client state | Zustand |
| Server | Hono on Bun, oRPC (contract-first in `packages/api`), Drizzle with libsql |
| Auth | better-auth with `@better-auth/expo`. Native Apple and Google sign-in by idToken. The admin plugin role marks Admins |
| Validation | Zod v4 + drizzle-zod |
| Dates | Temporal polyfill |
| i18n | i18next + react-i18next + expo-localization; Arabic by default, right-to-left |
| Web | TanStack Start + shadcn/ui + Tailwind v4 |
| Maps | expo-maps |
| Prayer Assistant | react-native-vision-camera v5 frame output; react-native-fast-tflite v3 running MoveNet Lightning; Mat mode from the camera's luminance (Y) plane; expo-speech-recognition for the Takbir; expo-keep-awake |
| Files | Railway buckets |
| Hosting | Railway (server and web) |
| Builds | EAS Build + EAS Submit |
| Over-the-air updates | Hot Updater, self-hosted on a Railway bucket |
| Monitoring | Sentry (native, server, web) |
| Analytics | Our own events table on the server |
| Quality | uncheck as the runner for oxlint, oxfmt, tsc and sherif; Ultracite oxlint/oxfmt preset (semicolons, double quotes); `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; pre-commit and Claude Code hooks |
| Tests | Vitest; end-to-end with e2e (tester.army), one test suite for web, iOS and Android |
| CI | GitHub Actions running uncheck and the tests |

## Layout (ADR-0005)

```
apps/native     app/ (thin routes) · features/<feature>/ · shared/{utils,ui,lib}
apps/web        routes/ (thin) · features/<feature>/ (landing, admin-*) · shared/{utils,ui,lib}
apps/server     features/<feature>/ (oRPC implementations, jobs) · shared/{utils,lib}
packages/domain domain/<feature>/ pure rules + domain/shared/
packages/api    api/<feature>/ oRPC contracts
packages/db-user | db-content   <feature>/ tables, one migrations folder per package
packages/db-server  auth, push tokens, contact, analytics tables
packages/auth   better-auth config
packages/content bundled Quran/books data + NOTICE per source
packages/config shared tsconfig/lint
packages/e2e    e2e tests
```

Feature folder: `screens/ components/ hooks/ data/ i18n/ utils/ index.ts`; `index.ts` is the only public entry point, and empty subfolders are omitted. Features never import each other. Routes and Home compose them, and cross-feature events go through the typed event bus in `shared/lib`. `shared/` never imports a feature. oxlint `no-restricted-imports` and dependency-cruiser enforce this.

Native features: onboarding, account, settings, home, prayer-times, prayer-log, khushu, qibla, prayer-assistant, reminders, calendar, gatherings, quran, books, recite-along, library-assets, lessons, tasbih, habits, programs, mood, companion, insights, announcements, contact. Web features: landing, admin-programs, admin-occasions, admin-gatherings, admin-lessons, admin-library-assets, admin-daily-content, admin-announcements, admin-messages, admin-analytics.

## Spike results (2026-10-15, iOS simulator only; Android skipped)

Reports: `docs/rebuild/spikes/`.

1. **Turso sync: partial pass.** All 6 cases passed against a local `tursodb --sync-server`:
   - A Guest database pushed its rows and newly created tables into a fresh, empty server database.
   - A second device bootstrapped; on a conflict, the last push won.
   - A pull-only content database worked.
   - The async `authToken` function was called.
   - Drizzle sqlite-proxy queries worked.

   `@tursodatabase/sync-react-native` 0.8.3 does not compile on RN 0.88. It needs `docs/rebuild/spikes/@tursodatabase%2Fsync-react-native@0.8.3.patch`, applied via bun `patchedDependencies`, until upstream fixes it. Still open: a run against Turso Cloud with a real read-only token, and Android.

2. **Panel UI RTL: cancelled by user** after partial results. Adopt Panel UI, with these workarounds:
   - Set RTL via expo-localization `forcesRTL: true`, not with JS `forceRTL` (expo-localization resets that on every launch).
   - Segmented Tabs lose their highlight in RTL; there's an unverified patch.
   - The `calendar="islamic"` grid shows Gregorian days, so we build our own Hijri grid.
   - Input placeholders need `textAlign` set to the start side.
   - Native tabs and the `@expo/ui` BottomSheet follow the device language, not forced RTL.
3. **Prayer Assistant: go with risks.**
   - The iOS build needs the Xcode Metal Toolchain, on dev machines and in CI.
   - MoveNet float16 on CPU is correct, at 5.7 ms. The CoreML delegate corrupted the float16 output on the simulator, so CPU is the default.
   - Arabic network speech worked. Transcripts start with U+200F (right-to-left mark), and iOS needs a restart loop.
   - On-device ar-SA was unavailable on the simulator.
   - The camera frame path still needs a physical device.

## External actions (owner: you)

- Email info@thaqalayn.net to confirm the rights to the translations, including Sayed Ali Raza's Nahj translation.

## Known old-app defects not to carry over

- Pushes are always sent in Arabic.
- Habit delete has a possible IDOR (one user could delete another's habit).
- The upload URL route needs no login.
- The learning-modules route is registered twice.
- The streak is not recalculated when a log is updated.
- The server guesses time zones from longitude.
- Template sending is duplicated.
- Package-item targetAudience and admin roles are stored but never used.
- The client and the database disagree on the default notification mode and nav items.
