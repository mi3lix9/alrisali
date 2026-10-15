---
title: Al-Risali rebuild: native, offline-first Shia companion (whole product)
labels: [ready-for-agent]
status: open
children: [0001-quran-reader]
---

## Problem Statement

Al-Risali (الرسالي) is a Shia spiritual companion: prayer times and tracking, devotional texts, dhikr, and daily acts of worship. Today it is a web app wrapped in Capacitor, running on Replit with one Postgres database and an Express server. Believers run into these problems:

- It doesn't feel native. Web UI sits inside a native shell, so it has web-style tabs, sheets and scrolling.
- It needs the network. Quran pages, settings, logs and most features call the server. Offline support is a partial queue that replays requests and resolves no conflicts.
- Guests are second-class. Worship, Insights, Favorites, Reading Completion and saving a Dhikr Session all require sign-in, and nothing a Guest recorded carries over when they sign in.
- Reminders are unreliable. A server job recalculates everyone's Prayer Times every 30 seconds with its own copy of the calculation, guesses time zones from longitude, sends only Web Push, and always sends in Arabic.
- Several features were never finished:
  - Quran progress is never saved.
  - Nahj al-Balagha has no text.
  - The Companion never gains XP.
  - Tasbih targets, export and notes were never built.
- There are defects and legal risks:
  - It looks like any user can delete another user's habit.
  - The upload route needs no login.
  - The prayer streak isn't recalculated when a day is edited.
  - Books were scraped from a non-commercial source.
  - Quran text comes from an API whose terms forbid bundling it.

The Al-Risali team also needs an admin tool that works well on desktop for publishing Programs, Occasions, Gatherings, Lessons, Library Assets, Daily Content and Announcements, and for reading Contact Messages.

## Solution

A from-scratch rebuild as an offline-first native app for iOS and Android, plus one web app for the public landing page and the admin tools.

- **Fat client, thin server.**
  - Every feature works on the device.
  - Each Believer, Guests included, has their own database on the device. Once they sign in, it syncs with a cloud database that belongs only to them.
  - Content published by Admins reaches devices as a read-only copy that the device pulls.
  - The server only signs Believers in, creates their databases and issues access to them, publishes content, sends Announcements, and receives Contact Messages and usage analytics.
- **Native look and feel.**
  - The shell is native: system tab bar, native stack and modals, SwiftUI/Compose controls and sheets where they fit.
  - Screens are built with Panel UI.
  - Arabic and right-to-left are the default, with English available.
- **Reminders are scheduled on the device.** Prayer Times, Imsak and Habit Reminders are computed and scheduled locally, so they work offline and use the device's real time zone. The server sends only Announcements.
- **Content is bundled.**
  - Quran: KFGQPC Hafs v30 (text, the page and line range of every ayah, the font, and the PDF the line breaks are worked out from), read in Page Mode or Surah Mode.
  - Books: re-sourced from Thaqalayn (CC BY 4.0).
  - Recitation streams and is cached for at most 7 days.
- **Every feature of the old app is ported and redesigned**, the Prayer Assistant included. Feed, the old surah-list page and the EPUB placeholder are dropped. Unfinished features are completed.
- **Free app; the code is MIT-licensed.** Bundled content keeps its own licences, credited in-app under Sources & Credits.

## User Stories

### Onboarding, Guests and accounts

1. As a new Believer, I want a short first-run flow (language, location, Calculation Method, Message Style), so that the app is configured for me in under a minute.
2. As a new Believer, I want to continue as a Guest without creating an account, so that I can start using the app immediately.
3. As a Guest, I want every feature available, so that I'm never blocked by a sign-in wall.
4. As a Guest, I want everything I record kept on my device, so that my worship history is mine even without an account.
5. As a Guest, I want to sign in with Apple or Google at any time and keep everything I recorded as a Guest, so that signing in never loses data.
6. As a Believer, I want to sign in with Apple on iOS and with Google on both platforms using the native system sheets, so that sign-in is quick and trustworthy.
7. As a signed-in Believer, I want my records synced to my own cloud database, so that they follow me to a new phone.
8. As a Believer with two devices, I want changes from both to merge, with the most recent edit winning when they conflict, so that my data stays consistent.
9. As a Believer, I want the app to keep working fully when I'm offline and to sync when I'm back online, so that connectivity never matters.
10. As a Believer, I want signing out to remove my data from this device after a confirmation, so that someone else using the phone can't see my records.
11. As a Believer, I want to delete my account and all my data from inside the app, so that I control my information (Apple guideline 5.1.1(v)).
12. As a Believer, I want to optionally give my birth year, so that the team can understand the age range of its users.

### Prayer Times and Qibla

13. As a Believer, I want today's Prayer Times (Imsak, Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Midnight) for my location, so that I know when to pray.
14. As a Shia Believer, I want the Ja'fari method by default (Fajr 18°, Isha 17°, Maghrib when the sun is 4° below the horizon, Dhuhr one minute after solar noon, Midnight halfway between Sunset and Fajr), so that the times match my school.
15. As a Believer, I want to choose another Calculation Method (Sunni, Hanafi, Ibadi), so that the app serves Believers of other schools too.
16. As a Believer at a high latitude, I want Maghrib to fall back to Sunset when the sun never reaches 4° below the horizon, so that times are always defined.
17. As a Believer, I want to set how many minutes before Fajr Imsak falls (default 10), so that Imsak matches my practice.
18. As a Believer, I want to hide Prayer Times I don't use (by default Imsak, Asr, Sunset and Isha are hidden), so that my timetable stays focused.
19. As a Believer, I want a live countdown to the next visible Prayer Time, so that I can plan around it.
20. As a Believer, I want my location from GPS, or from searching a city name, so that times are accurate wherever I am.
21. As a Believer, I want my location refreshed when the app returns to the foreground after I've travelled, so that times stay correct on trips.
22. As a Believer, I want times shown in my chosen 12-hour or 24-hour format, so that they read naturally.
23. As a Believer, I want a Qibla compass with the bearing and distance to the Kaaba and a clear "facing Qibla" state, so that I can orient myself to pray.

### Prayer Log, Prayer Streak and Khushu

24. As a Believer, I want to tick each Salah I performed today, so that I keep a Prayer Log.
25. As a Believer, I want to log or correct any past date but no future one, so that my log is honest and complete.
26. As a Believer, I want to confirm before un-ticking a Salah, so that I don't erase it by accident.
27. As a Believer, I want my Prayer Streak (consecutive days on which all five Salah were logged, up to today) always recalculated from my logs, including after edits, so that it's always correct.
28. As a Believer, I want to rate my Khushu for a Salah and pick Distractions (or type my own), so that I can reflect on and improve my focus.
29. As a Believer, I want to change or remove a Khushu entry, so that I can fix mistakes.

### Prayer Assistant

30. As a Believer, I want a Prayer Assistant that follows me through a Salah and keeps count of my Rak'ahs and Positions, so that I don't lose count.
31. As a Believer, I want to choose the Salah (Fajr 2, Dhuhr 4, Asr 4, Maghrib 3, Isha 4 Rak'ahs), so that the count and the middle tashahhud are right.
32. As a Believer, I want to choose a Recognition Mode (Camera, Head Height, Sound/Takbir, Mat), so that it suits my space and device.
33. As a Believer using Camera mode, I want my Positions (Qiyam, Ruku, I'tidal, Sujud, Jalsa, Tashahhud) detected from the camera with the preview hidden by default, so that I'm not tempted to watch myself pray.
34. As a Believer using Mat mode, I want to lay the phone face-up on my prayer mat so that each sujud covering the camera counts, so that I can pray without the phone in view.
35. As a Believer using Sound mode, I want spoken "Allahu Akbar" to advance the Prayer Assistant, so that I can rely on my recitation.
36. As a Believer, I want to choose a Pace (Slow, Normal, Fast, Custom) and a bowing sensitivity, so that detection matches how I pray.
37. As a Believer, I want to advance by tapping whenever sensing fails or isn't available, so that the Prayer Assistant always works.
38. As a Believer, I want to be told when on-device Arabic speech isn't available, with a fallback, so that I understand any limits.
39. As a Believer, I want the screen to stay awake during the Prayer Assistant and the camera and microphone to be used only while it's open, so that my privacy is respected.
40. As a Believer, I want to finish with the final tashahhud hold, then log the Salah and rate Khushu in one step, so that my records follow from praying.

### Calendar, Occasions and Gatherings

41. As a Believer, I want today's Hijri Date everywhere it matters, so that I live by the Islamic calendar.
42. As a Believer, I want the Hijri Date to include the Admins' Hijri Adjustment plus my own (±2 days), so that it matches the moon sighting I follow.
43. As a Believer, I want a Hijri month grid with Gregorian dates alongside, so that I can plan.
44. As a Believer, I want Occasions (about 55 built-in Shia occasions plus ones the Admins add) marked by type (celebration, mourning, religious, fasting), so that I know what each day commemorates.
45. As a Believer, I want today's Occasions on Home, so that I never miss one.
46. As a Believer, I want to browse Gatherings by list, day, week and month, and on a map, so that I can find majalis near me.
47. As a Believer, I want to filter Gatherings by Speaker, so that I can follow the speakers I like.
48. As a Believer, I want Gathering details (time, venue, map, Speaker, livestream link, who may attend), so that I can attend or watch.

### Quran (detailed in child spec 0001)

49. As a Believer, I want the whole Quran offline as the 604 Quran Pages of the Madinah mushaf (Hafs), so that I can read anywhere.
50. As a Believer, I want Page Mode laid out like print and Surah Mode as reflowing text, so that I can read the way I prefer.
51. As a Believer, I want to turn pages by swiping horizontally or by scrolling vertically, so that page turning suits me.
52. As a Believer, I want a full-screen reader whose controls appear on a tap, so that nothing distracts me.
53. As a Believer, I want my Last-Read Ayah shared by both modes and shown under "Continue reading", so that I always resume exactly where I stopped.
54. As a Believer, I want an index, page jump, a scrubber, search that ignores diacritics, and a return to my previous position, so that I can move through the Quran quickly.
55. As a Believer, I want streamed recitation with a choice of reciter, so that I can listen while reading.
56. As a Believer, I want to favourite and copy ayat, so that I can keep and share them.

### Books, Supplications and Recite-Along

57. As a Believer, I want Mafatih al-Jinan, Sahifa Sajjadiyya and Nahj al-Balagha bundled and browsable, so that my core devotional texts are always with me.
58. As a Believer, I want to read a Supplication in Arabic, English or both, with adjustable font size, so that I can read and understand it.
59. As a Believer, I want to mark a Supplication as read today (Reading Completion), so that I can track my devotions.
60. As a Believer, I want to favourite Supplications, so that I can return to them quickly.
61. As a Believer, I want Recite-Along to highlight each Arabic word as I go, driven by holding the screen, a timed pace, or my voice, so that I keep my place while reciting.
62. As a Believer using voice Recite-Along, I want matching that tolerates missing diacritics, small mispronunciations and skipped words, and never moves backwards unless I restart, so that it follows me reliably.
63. As a Believer, I want search across Surahs, Books and Library Assets, so that I can find any text.

### Library Assets and Lessons

64. As a Believer, I want to open Library Assets the Admins publish (PDF, audio, video, structured text), so that I can use extra study material.
65. As a Believer, I want my reading position in a Library Asset remembered, so that I can resume it.
66. As a Believer, I want to browse Lessons by category (aqeedah, fiqh, akhlaq, history), so that I can learn.
67. As a Believer, I want to swipe through a Lesson's Slides with captions and have my progress saved, so that I can continue later.
68. As a Believer, I want Lesson progress shown accurately, based on the Lesson's real number of Slides, so that I know how far I've got.

### Tasbih

69. As a Believer, I want Tasbih al-Zahra always present and first (Allahu Akbar ×34, Alhamdulillah ×33, Subhanallah ×33), so that the most important dhikr is one tap away.
70. As a Believer, I want each tap to give light haptic feedback and each completed step a stronger one before it auto-advances, so that I can count without looking.
71. As a Believer, I want a completed round of Tasbih al-Zahra saved as a Dhikr Session automatically, so that my dhikr is recorded.
72. As a Believer, I want to create Open Tasbih counters with a name, an optional target and notes, so that I can count any dhikr.
73. As a Believer, I want a notification and haptic feedback when an Open Tasbih reaches its target, so that I know when I'm done.
74. As a Believer, I want to save the current count as a Dhikr Session and reset it, with a confirmation before resetting, so that I don't lose counts.
75. As a Believer, I want to export my Dhikr Sessions as CSV or JSON, so that I own my history.
76. As a Believer, I want counting to stay instant on every tap even while syncing, so that dhikr is never interrupted.

### Worship: Habits, Programs and Acts

77. As a Believer, I want to create Habits that repeat daily, on chosen weekdays or once, so that I can build personal acts of devotion.
78. As a Believer, I want an optional Reminder time on a Habit, so that I don't forget it.
79. As a Believer, I want to archive or delete my Habits, so that my list stays current.
80. As a new Believer, I want a few default Habits (read one Quran Page, morning and evening adhkar, drink water), so that I have a place to start.
81. As a Believer, I want to browse Official Programs (general and seasonal), so that I can follow curated worship plans.
82. As a Believer, I want Seasonal Programs to appear only within their Hijri window (for example Muharram, Ramadan, Fatimiyya), so that what I see is timely.
83. As a Believer, I want to subscribe to a Program, within the limits of five active Subscriptions, one General and one Seasonal Official Program, with a clear message when I reach a limit, so that my plan stays manageable.
84. As a Believer, I want to pause and resume a Subscription, so that I can take breaks without losing it.
85. As a Believer, I want to build my own Personal Programs from Acts, so that I can design my own routine.
86. As a Believer, I want to see each day's Acts grouped by Salah (before, after) and general, for any date I pick, so that I know what to do and when.
87. As a Believer, I want an Act's sheet to show its dua (Arabic, transliteration, translation, audio, instructions) or its prayer steps (Rak'ahs, steps, adhkar, wudu requirement), so that I can perform it correctly.
88. As a Believer, I want to tick an Act as done (Act Completion) and undo it if I ticked it by mistake, so that my record is accurate.
89. As a Believer, I want a badge on Programs I haven't seen yet, so that I notice what's new.

### Mood, Companion and Insights

90. As a Believer, I want to record how I feel (happy, calm, sad, stressed, angry) and receive a Remedy (a saying or dua), so that I find comfort and guidance.
91. As a Believer, I want a Companion (Garden or Traveler) that grows as I gain XP, so that I feel encouraged.
92. As a Believer, I want XP for logging a Salah, completing an Act or Habit, finishing a Dhikr Session, a Reading Completion and finishing a Lesson, with a level-up celebration, so that devotion feels rewarding.
93. As a Believer, I want Insights: overview, weekly chart, heatmap, Prayer Streak, Habit streaks, Tasbih totals, mood distribution and Distractions breakdown, all computed on my device, so that I can understand my patterns, offline and privately.
94. As a Guest, I want Insights too, so that I'm not pushed to sign in to see my own patterns.

### Home

95. As a Believer, I want Home to show the next Salah countdown, the Hijri Date and Occasions, quick Prayer Log ticks, Mood Check-in, Daily Content, Verse of the Day with recitation, my Companion and "Continue reading", so that my day starts in one place.
96. As a Believer, I want the Daily Content the Admins feature for each weekday to open the right Supplication, so that I can follow the day's dua or ziyarah.

### Reminders and Announcements

97. As a Believer, I want a Reminder before each Salah (minutes before, default 5) with a chosen sound, and to be able to mute, use a voice alert or disable each Salah on its own, so that each Salah notifies the way I want.
98. As a Believer, I want an Imsak Reminder, so that I don't miss the start of the fast.
99. As a Believer, I want Reminders to work offline and follow my real time zone, including daylight saving, so that they're never wrong.
100.  As a Believer, I want Reminders scheduled for the coming days and topped up whenever I open the app, so that they keep firing within iOS's limit of 64 pending notifications.
101.  As a Believer, I want quiet hours, so that non-essential notifications don't disturb me.
102.  As a Believer, I want to choose a Message Style (Classic, with scriptural sources; Modern, with gentle coaching), so that the app speaks in a voice I like.
103.  As a Believer, I want Announcements from the team in my language, with an in-app inbox, so that I don't miss important notices.
104.  As a Believer, I want to turn Announcements off, so that I control what reaches me.

### Settings, language and accessibility

105. As a Believer, I want Arabic right-to-left by default and English left-to-right, switchable, so that the app speaks my language.
106. As a Believer, I want light and dark themes (Quran dark is pure black), so that reading is comfortable at any hour.
107. As a Believer, I want to adjust text size, so that everything is readable.
108. As a Believer, I want to choose which tabs appear (Home is always shown), so that the app fits my routine.
109. As a Believer, I want to set my own Hijri Adjustment, the Prayer Assistant's Pace and sensitivity, and the Quran's page navigation, so that the app matches my practice.
110. As a Believer using VoiceOver or TalkBack, I want every control labelled and every text readable, so that the app is accessible.
111. As a Believer, I want a Sources & Credits screen (KFGQPC, Thaqalayn, Quran.Foundation and others), plus Privacy and Terms, so that I know where the content comes from and how my data is treated.
112. As a Believer, I want to send the team a Contact Message, even as a Guest, with validation and abuse protection, so that I can give feedback.

### Admin web app

113. As an Admin, I want to sign in to the admin web app with the same Apple or Google account, and have access only if I'm given the Admin role, so that admin access is controlled.
114. As an Admin, I want to create, edit, order, activate and deactivate Official Programs and their Acts (including dua and prayer Acts, and sunnah prayer presets), with Hijri windows for Seasonal Programs, so that I can curate worship plans.
115. As an Admin, I want to manage Occasions (Hijri day and month, names in Arabic and English, type), so that the calendar stays complete.
116. As an Admin, I want to set the global Hijri Adjustment, so that every Believer's Hijri Date matches the official sighting.
117. As an Admin, I want to manage Gatherings (date, time, venue with map location, Speaker with photo, livestream, who may attend, active), so that Believers can find majalis.
118. As an Admin, I want to manage Lessons and their Slides (upload images, captions, order, publish), so that I can teach.
119. As an Admin, I want to upload and publish Library Assets (with covers, categories and order), so that I can share study material.
120. As an Admin, I want to choose the Daily Content for each weekday by picking a Supplication (by its stable id), so that Home features the right text.
121. As an Admin, I want to write Announcements in Arabic and English, save drafts, schedule them, publish now, duplicate them and target an audience (everyone, active Believers, new Believers), so that I can reach Believers effectively.
122. As an Admin, I want to send myself a test Announcement, so that I can check it before broadcasting.
123. As an Admin, I want a Contact Message inbox with unread counts and statuses (new, read, replied, archived), so that I can answer Believers.
124. As an Admin, I want usage analytics (summary, popular sections, daily active users, feature usage, retention, Guest share, devices, ages), so that I can see how the app is used.
125. As an Admin, I want published content to reach every device's offline copy on its next sync, so that updates spread without an app release.

### Landing page

126. As a visitor, I want a public landing page in Arabic and English describing Al-Risali with App Store and Play Store links, so that I can install the app.
127. As a visitor, I want the Privacy, Terms and Contact pages on the web, so that I can review them before installing.

### Operations

128. As the team, I want over-the-air JavaScript updates through Hot Updater, so that fixes reach Believers quickly.
129. As the team, I want crash and error reports from the app, the server and the web app in Sentry, so that we can find and fix problems.
130. As the team, I want every change checked by lint, format, type checks, tests and e2e in CI, so that quality stays high.

## Implementation Decisions

### Architecture (ADR-0001 per-user Turso database, ADR-0002 Guest data is the future user database, ADR-0003 Reminders on the device, ADR-0004 Quran from KFGQPC)

- **Three kinds of database.** All use the SQLite dialect via Drizzle.
  - **Per-user database:** one Turso cloud database per Believer, synced with a database on the device. It holds Prayer Logs, Khushu, Habits, Subscriptions, Personal Programs and their Acts, Act Completions, Tasbih and Dhikr Sessions, Mood Check-ins, Favorites, Reading Completions, Lesson progress, Companion XP, Last-Read Ayah and Believer settings.
  - **Content database:** one shared Turso database, written only by the admin side. Devices keep a pull-only copy using a read-only token. It holds Official Programs and Acts, Occasions, Gatherings and Speakers, Lessons and Slides, the Library Asset index, the Daily Content map, Announcements and the global Hijri Adjustment.
  - **Server database:** Turso. It holds auth (better-auth), Admin roles, push tokens, Contact Messages and analytics events.
- **On the device:**
  - Turso React Native sync, carrying a native patch until upstream supports React Native 0.88.
  - Drizzle through its sqlite-proxy driver.
  - TanStack Query for reads, invalidated after local writes and after a pull that brought changes.
  - Zustand for UI state.
  - Fallback if sync fails its gate: expo-sqlite with Drizzle live queries, plus our own outbox push/pull through oRPC.
- **Guest → Believer:**
  - A Guest database is opened in sync mode from the start, with a URL function that returns nothing and initial download turned off.
  - At sign-in the server creates the Believer's cloud database (Platform API, one group, named by user id). The URL function then returns it, and the first push uploads all Guest data.
  - One database file per Believer on the device.
  - Sign-out deletes the local database.
  - Account deletion destroys the cloud database and the auth rows.
- **Access tokens:** the server mints short-lived tokens scoped to one database through an oRPC route, and the device's token function fetches and caches them. The content database uses a read-only token.
- **Schema:**
  - Synced tables change additively only: new tables, and columns that are nullable or have defaults.
  - A schema version row records the version.
  - The app runs its bundled migrations before pushing.
  - Destructive changes go into new tables, with a backfill.
- **Sync semantics:** the last push wins. Records carry stable ids, so Guest records keep their identity after sign-in.

### Monorepo and stack

- bun workspaces with Turborepo. Code is organised by feature, with lint-enforced boundaries (ADR-0005). Every app has `features/<feature>/` and `shared/`. The domain, api, db-user and db-content packages are split per feature. Features never import each other and communicate through a typed event bus.
- Apps:
  - Native app (Expo SDK 58, dev client, New Architecture).
  - Web app (TanStack Start: landing pages plus admin).
  - Server (Hono on Bun, oRPC).
- Packages:

  | Package | Contents |
  | --- | --- |
  | domain | Pure TypeScript, no IO |
  | api | oRPC contracts |
  | auth | better-auth configuration |
  | db-user, db-content, db-server | Drizzle schemas and migrations |
  | content | Bundled Quran and Books data, with a notice per source |
  | config | Shared configuration |
  | e2e | End-to-end tests |
  | ui | Web shadcn components (consumed through the web app's `shared/ui`) |

- Native app:
  - Shell: expo-router native tabs, stack and modals; `@expo/ui` for SwiftUI/Compose controls and sheets.
  - Screens: Panel UI on Uniwind with Tailwind v4.
  - Maps: expo-maps.
  - RTL: expo-localization with `forcesRTL`.
  - Panel UI workarounds:
    - Segmented tabs in RTL.
    - Our own Hijri grid instead of Panel's Islamic calendar.
    - Input placeholders aligned to the start side.
    - Native tabs and the `@expo/ui` sheet follow the device language, not forced RTL.
- Web app: shadcn/ui with Tailwind v4.
- Validation and contracts: Zod v4 with Drizzle's built-in Zod support; oRPC contracts are written first.
- Dates and time zones: the Temporal polyfill.
- i18n: i18next and react-i18next with expo-localization, Arabic by default. Locale keys are typed.
- Auth: better-auth with the Expo plugin.
  - Native sign-in by ID token: Apple (expo-apple-authentication) and Google (native Google Sign-In).
  - Sessions are kept in SecureStore.
  - The admin plugin role marks Admins.
- Push: Expo Push, for Announcements only.
- Files: Railway buckets (Library Assets, Slides, Speaker photos).
- Hosting: Railway, for the server and the web app.
- Builds: EAS Build and EAS Submit. Over-the-air updates: Hot Updater, self-hosted on a Railway bucket.
- Monitoring: Sentry for native, server and web.
- Code quality:
  - uncheck runs oxlint, oxfmt, tsc and sherif, using Ultracite's oxlint and oxfmt preset (semicolons, double quotes).
  - TypeScript runs in strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
  - Pre-commit hooks and Claude Code hooks run the same checks.
- CI: GitHub Actions. The Metal Toolchain is a prerequisite on the macOS builders.
- Bundle identifiers: `com.alrisali.app` for production, `com.alrisali.app.dev` for development. The URL scheme is `alrisali`.

### Domain modules (pure TypeScript in the domain package; the UI and server only call these)

- **Prayer Times:**
  - Our own astronomical calculation. Methods:

    | Method | Rules |
    | --- | --- |
    | Ja'fari | Fajr 18°, Isha 17°, Asr shadow factor 1, Maghrib at −4° with a fallback to Sunset |
    | Sunni | Sunset at 0.833°, Maghrib = Sunset |
    | Hanafi | Asr shadow factor 2 |
    | Ibadi | Isha 18° |

  - Dhuhr is solar noon + 1 minute. Midnight is halfway between Sunset and the next Fajr. Imsak is Fajr minus the configured minutes.
  - Also provides the next and active Prayer Time, respecting Hidden Prayer Times.
  - Uses real IANA time zones through Temporal.
- **Hijri:**
  - Umm al-Qura through Intl, with an arithmetic fallback.
  - The effective date applies the Admin Hijri Adjustment plus the Believer's adjustment (±2). Guests get the Admin adjustment.
  - Builds the month grid, resolves Occasions for a date, and decides whether a date falls inside a Hijri window (inclusive).
- **Prayer Streak:**
  - Derived, never stored: the count of consecutive days on which all five Salah were logged, ending at the given date.
  - The day being evaluated must itself be complete; otherwise the streak is 0.
- **Tasbih:**
  - Tasbih al-Zahra state machine: steps 34, 33, 33; it auto-advances, a completed round yields a Dhikr Session of 100, then it resets.
  - Open Tasbih with a target event.
  - Legacy-name normalisation is not needed, because everyone starts fresh.
- **Programs and Acts:**
  - Subscription rules: at most 5 active, at most 1 General and 1 Seasonal Official Program. Personal Programs can be subscribed to only by their creator.
  - Errors are typed: already subscribed, maximum packages, maximum general, maximum seasonal.
  - Act visibility for a date: daily; specific weekdays; a specific date; a Seasonal Program only within its Hijri window.
  - Grouping: before a Salah, after a Salah, general.
- **Habits:** schedule evaluation for daily, specific weekdays and once, and computation of Habit streaks.
- **Companion:**
  - XP rules per event: Salah logged, Act or Habit completed, Dhikr Session, Reading Completion, Lesson completed.
  - 100 XP per level, with stage names for Garden and Traveler.
  - Each XP award is idempotent per event, so replays and syncs never award twice.
- **Reminder planner:**
  - Given settings, location, Prayer Times and Habits, it produces the ordered list of local notifications for a rolling window.
  - Per-Salah rules: minutes before, sound, mute, voice, disable.
  - Applies Imsak and quiet hours.
  - Caps the list at 64 notifications on iOS.
  - The app applies its diff on launch, on resume and after settings change.
- **Insights:** pure aggregations over the local data: overview, weekly, heatmap (84 days), Habit streaks, Tasbih totals, mood distribution, Distractions.
- **Recite-Along matcher:**
  - Arabic normalisation: strip diacritics, tatweel and punctuation; unify أإآٱ→ا, ة→ه, ى→ي, ؤ→و, ئ→ي.
  - A fuzzy match tolerates one edit, after stripping fused prefixes (ال و ف ب ل ك س).
  - The matcher looks ahead 8 words and only moves forward.
  - Speech transcripts can begin with an invisible right-to-left mark (U+200F), which must be stripped.
- **Prayer Assistant:**
  - Rak'ah state machine:
    - Rak'ah counts per Salah, with a middle tashahhud after Rak'ah 2 in Salah of 3 and 4 Rak'ahs.
    - Hold durations depend on Pace: 800 ms by default, 450 ms when rising for the next Rak'ah, 3000 ms for tashahhud. Limits: hold 300–2500 ms, tashahhud 1000–8000 ms, pulse 500–3000 ms.
    - Final tashahhud completion: 8 s (Fast), 12 s (Normal), 18 s (Slow).
  - Position classifier over the 17 MoveNet keypoints, with a self-calibrating standing reference and a bowing sensitivity of 0–100 (default 70).
  - Head-height classifier.
  - Mat sujud detector: a luminance dip with per-device calibration, held 1.2–2.4 s.
  - Takbir detector over speech transcripts.
  - The sensing adapters (camera, speech) live in the native app and feed these pure modules.
- **Quran reader model:** as specified in child spec 0001.

### Native sensing (Prayer Assistant)

- react-native-vision-camera v5 delivers frames.
  - react-native-fast-tflite v3 runs MoveNet SinglePose Lightning (float16, CPU by default; the CoreML delegate corrupted results on the simulator).
  - Mat mode uses the luminance plane of the same frames, with exposure locked when possible.
- expo-speech-recognition runs continuous recognition with interim results, checks on-device availability for ar-SA, and restarts in a loop on iOS.
- expo-keep-awake keeps the screen on. Camera and microphone are used only in the foreground. Permission strings explain the hidden preview.

### Server (thin; oRPC contracts first)

- **Auth:** better-auth with Apple and Google ID tokens; an account deletion endpoint; Admin role checks on every admin procedure.
- **Per-user database provisioning:** an idempotent "ensure my database" call on first sign-in, plus a token-minting procedure.
- **Content publishing:** admin CRUD writes to the content database; every write passes Zod validation.
- **File uploads:** presigned uploads to a Railway bucket, requiring an authenticated Admin.
- **Announcements:**
  - Drafts, scheduling, publishing, duplicating, audience targeting (all, active, new) and per-language text.
  - A scheduler publishes due Announcements and sends them through Expo Push, in each recipient's language.
  - Push tokens are registered per device, and dead tokens are pruned.
- **Contact Messages:** open to Guests, rate-limited by a hash of the IP address; an admin inbox with statuses.
- **Analytics:** the app sends batched events (screen view, feature use, action) with an anonymous device id, an optional user id and device metadata. The admin reports are computed on the server.
- **What the server never does:** read or write a Believer's records, compute Prayer Times, or store a Believer's location.

### Content (bundled)

- **Quran:** KFGQPC Hafs v30. The line breaks inside multi-line ayat are derived at build time from the KFGQPC PDF. See child spec 0001.
- **Books:** Mafatih al-Jinan, Sahifa Sajjadiyya and Nahj al-Balagha.
  - Arabic and English come from Thaqalayn (CC BY 4.0) at build time and are bundled as static data with stable Supplication ids.
  - The content database refers to Supplications only by id (for example, Daily Content).
  - The al-islam.org data scraped by the old app is not used.
- **Recitation:** streamed from the Quran Foundation audio API and cached for at most 7 days. Verse of the Day uses the same source.
- **Attribution:** each source gets a notice in the content package and an entry on the in-app Sources & Credits screen.

### Defects not carried over

- Every per-user operation is scoped to the owner by construction: each Believer has their own database.
- Uploads require an Admin.
- The Prayer Streak is derived.
- Reminders and Announcements respect the Believer's language and time zone.
- Each route is registered once.
- `targetAudience` is honoured.
- Admin roles are enforced.
- One source of truth for defaults: the domain package.

## Testing Decisions

- **What a good test is:**
  - It tests external behaviour through a seam's public interface, as a consumer would use it: boundaries, invariants, transitions, precedence, errors.
  - Tests are deterministic (fake clocks, fixed locations) and isolated, and safe to run with the full suite.
  - No tests of wiring, copied data, forwarding or incidental defaults.
- **Seam 1, the domain package** (Vitest). The main seam; most behaviour lives here.
  - Prayer Times: known-good times for fixed cities and dates per method (for example Qatif, Najaf, Karbala, London in summer, a high-latitude city in midsummer for the Maghrib fallback), Midnight, Imsak, DST transitions.
  - Hijri: conversion, combined adjustments, month grid, Occasions resolution, Hijri windows crossing a year boundary.
  - Prayer Streak: complete and incomplete days, gaps, edits to past days.
  - Tasbih: the full Tasbih al-Zahra round produces exactly one Dhikr Session of 100 and resets; Open Tasbih target events.
  - Programs: every subscription limit error; Act visibility per frequency; Seasonal windows.
  - Companion: each XP event awards once only, level thresholds.
  - Reminder planner: window size, the 64-notification cap, mute/voice/disable precedence, quiet hours, time zone changes.
  - Recite-Along matcher, Takbir detector, rak'ah state machine, and Mat detector, driven by recorded fixture sequences.
  - The old app's verify scripts become test fixtures.
  - Quran reader model (see 0001).
- **Seam 2, per-user data** (Vitest with a local database). The repository API over the device database:
  - Writes and reads per entity.
  - Additive migrations applied before push.
  - Guest → sign-in: Guest rows and tables reach a fresh database on a local tursodb sync server; a second device bootstraps; same-row conflicts resolve to the last push.
  - Sign-out wipes local data.
- **Seam 3, the server oRPC router**, called in-process with a test database:
  - Auth guards: anonymous vs Believer vs Admin on every procedure.
  - Database provisioning is idempotent; tokens are scoped to the caller's database.
  - Content CRUD validation.
  - Announcement scheduling, audience targeting and language selection, with a fake push transport.
  - Contact rate limiting.
  - Analytics ingestion and reports.
  - Account deletion removes everything.
- **Seam 4, content integrity** (Vitest over the generated bundles):
  - Quran checks per 0001.
  - Every Book Supplication has a unique, stable id.
  - Daily Content references resolve.
  - Each source has a notice.
- **Seam 5, end-to-end** (the `e2e` package, tester.army e2e). Native iOS first, Android when available, plus the web.
  - Onboarding as a Guest.
  - Log a Salah, then see the Prayer Streak and Companion XP.
  - Tasbih al-Zahra round.
  - Subscribe to a Program until a limit error.
  - Open a Supplication and mark it complete.
  - Quran resume flow.
  - Sign in, then data persists.
  - Admin publishes an Announcement and Occasion, and the device receives the content.
  - Landing page loads in both languages.
- **Prior art:** none in the new repo yet. The old app's behavioural checks of pure logic (the recite matcher and mat detection verify scripts) set the style for seam 1. The Turso sync spike's in-app test runner is the model for seam 2.

## Out of Scope

- Data migration from the old Postgres database. Everyone starts fresh.
- A public web version of the Believer app. The web is limited to the landing page and admin.
- Riwayat other than Hafs, Quran translations and tafsir, tajweed colouring, offline recitation downloads beyond the 7-day cache, and Recite-Along for the Quran.
- The social feed (Feed), the old surah-list page, and EPUB reading.
- Payments, ads and subscriptions. The app is free.
- Third-party analytics platforms.
- Server-side Prayer Time notifications or storing location on the server.
- Any guaranteed offline Arabic speech recognition. Availability depends on the device, with a fallback.

## Further Notes

- Vocabulary follows the glossary: Believer, Guest, Admin, Salah, Prayer Time, Calculation Method, Prayer Log, Prayer Streak, Khushu, Prayer Assistant, Recognition Mode, Position, Rak'ah, Pace, Hijri Date, Hijri Adjustment, Occasion, Gathering, Speaker, Quran Page, Page Mode, Surah Mode, Last-Read Ayah, Book, Supplication, Library Asset, Favorite, Reading Completion, Recite-Along, Daily Content, Verse of the Day, Tasbih, Tasbih al-Zahra, Open Tasbih, Dhikr Session, Habit, Program, Subscription, Act, Act Completion, Mood Check-in, Remedy, Companion, Reminder, Announcement, Message Style, Lesson, Slide, Contact Message.
- **Gates and open items:**
  - The Turso sync gate (ADR-0001) passed locally on iOS. It still needs a Turso Cloud read-only token check and an Android run.
  - The Prayer Assistant camera path needs a physical device.
  - The Panel UI right-to-left spike was cancelled. The known workarounds are listed above.
- **External actions:**
  - Confirm the Thaqalayn translation rights (including Sayed Ali Raza's Nahj al-Balagha).
  - Create a Quran Foundation developer account for audio.
- **The UX was validated in the throwaway prototype** on branch `prototype/full-ux`. It covers every feature, three Home variants, and the full-screen Quran reader. Don't port prototype code. The winning Home variant is still to be chosen. One open design question: Panel UI's dark theme turns the primary colour white, so the dark-mode accent needs choosing.
- **Child specs:**
  - 0001: Quran reader.
  - Further children should be split per area as work starts: Prayer & Reminders, Worship, Tasbih, Books & Recite-Along, Calendar & Gatherings, Prayer Assistant, Sync & Accounts, Admin, Landing.
