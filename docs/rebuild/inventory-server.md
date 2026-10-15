# Server inventory: الرسالي (Alrisali) Express backend

Classes: **U** = per-user data, **A** = global content written by admins, **S** = static bundled data/scripts, **J** = server-only job, **X** = auth/infra.

## Tables (shared/schema.ts)

| Table | Key fields | Class | Notes |
| --- | --- | --- | --- |
| sessions (7) | sid, sess, expire | X | connect-pg-simple, TTL 1y (replitAuth.ts:22-43) |
| users (20) | id uuid, email unique, first/lastName, profileImageUrl, birthYear, googleId unique, appleId unique | U/X | old Replit Auth users keep their Replit `sub` as id |
| api_tokens (38) | userId, tokenHash sha256, expiresAt (1y), lastUsedAt | X | native bearer tokens |
| auth_exchange_codes (53) | userId, codeHash, codeChallenge (PKCE), expiresAt (5 min) | X | deep-link handoff |
| user_devices (68) | deviceType mobile/tablet/desktop, osName, osVersion, browser, userAgent, lastSeenAt | U (analytics) | POST /api/user/device parses the UA (routes.ts:324) |
| app_settings (90) | key unique, value text | A | only key in use: `hijri_date_offset` |
| prayer_logs (105) | date text, fajr/dhuhr/asr/maghrib/isha bool, streakCount | U | streak rule below |
| moods (129) | moodType, remedy, moodDate, intensity | U |  |
| user_settings (147) | notificationMode classic, emotionalTone, morning/midday/eveningTime, quietHours*, location/lat/lng (text), calculationMethod default "shia", navItems [home,habits,library,events,analytics], xp, characterLevel, characterType "traveler", prayer/generalNotificationsEnabled, notificationSound "adhan_makkah", notificationMinutesBefore 5, mutedPrayers, habitsSeeded, hijriDateOffset, imsakMinutesBefore 10, hiddenPrayers [imsak,asr,sunset,isha], voiceNotificationPrayers, disabledNotificationPrayers, fontSize, timeFormat 24h, prayerPacePreset/HoldMs/TashahhudMs/PulseMs, prayerBowSensitivity 70 | U | ranges: PACE_LIMITS hold 300-2500, tashahhud 1000-8000, pulse 500-3000; bow 0-100 (schema.ts:204-218) |
| tasbih_sessions (253) | dhikrType, count, sessionDate | U |  |
| tasbih_counters (271) | name, mode traditional/open, count, sequenceStep 0-2, customTarget, isActive, isDefault, sortOrder | U | default counter is "tasbih_zahra" |
| calendar_events (301) | day 1-30 (Hijri), month name, nameAr/En, type celebration/mourning, isBuiltIn | A | Islamic occasions (مناسبات) |
| quran_progress (325) | surahNumber, surahName, lastRead, completed | U |  |
| favorites (342) | itemType, itemId, itemTitle, itemSubtitle | U |  |
| habits (361) | name, labelKey, isDefault, frequency daily/specific_days/one_time, days[0-6], reminderEnabled/Time, isArchived, descriptionEn/Ar | U | habitsSeeded flag seeds the default habits |
| habit_logs (392) | habitId, date, completed | U |  |
| prayer_item_logs (408) | itemId→habit_package_items, prayerId, date, completed, completedAt | U |  |
| focus_logs (427) | prayer, date, focusLevel, distractions[], customDistraction | U | الخشوع (prayer focus) |
| admin_users (451) | userId unique, role admin/superadmin | X | role is never checked |
| habit_packages (468) | nameEn/Ar, desc, category general(عام)/seasonal(موسمي)/custom, icon, isActive, displayOrder, createdByUserId, start/endDateHijri "d/m/yyyy" | A when createdByUserId is null, U otherwise | packages are called "programs" in user-facing errors |
| habit_package_items (506) | packageId, names, frequency daily/specific_days/specific_date, days, specificDate, timing pre/post/general, linkedPrayer, itemType regular/dua/prayer, dua* fields (Arabic, English, transliteration, instructions, audioUrl), prayerKey, rakaatCount, prayerSteps, prayerAdhkar, requiresWudu | A or U |  |
| user_habit_packages (553) | userId, packageId, isActive, subscribedAt | U |  |
| learning_modules (570) | title/content En/Ar, category aqeedah/fiqh/akhlaq/history/general, type article/video/audio/quiz, mediaUrl, thumbnailUrl, isPublished, displayOrder | A |  |
| module_slides (599) | moduleId (cascade), slideOrder, imageUrl, captionEn/Ar | A |  |
| user_module_progress (623) | moduleId, lastSlideIndex, completedAt | U |  |
| library_assets (641) | title/author/desc En/Ar, category, fileUrl, coverImageUrl, fileType pdf/epub/audio/video, fileSize, isPublished, downloadCount | A | files live in object storage |
| notification_templates (675) | key unique, title/message En/Ar, category, emotionalTone, status draft/published/scheduled, targetAudience all/active_users/new_users, scheduledAt, publishedAt, isActive | A | targetAudience is stored but never used for sending |
| events (707) | names/desc, eventType celebration/mourning/lecture/other, eventDate, start/endTime, venueName/Address, lat/lng, sheikhName(Ar), sheikhPhotoUrl, liveStreamUrl, genderAccess male/female/both, isActive | A | gatherings (مجالس) |
| analytics_events (744) | userId nullable, eventType page_view/feature_use/action, eventName, eventData jsonb | U/anon |  |
| contact_messages (766) | userId nullable, name, email, subject, message (length limits), ipHash, userAgent, status new/read/replied/archived | U/anon, read by admins |  |
| push_subscriptions (798) | userId, endpoint, p256dh, auth | U | Web Push only |
| daily_content_config (821) | dayOfWeek, contentType dua/ziyarat/prayer/commonDuas/tonightsDua, route, titleKey, descriptionKey, isActive | A | maps each weekday to client routes such as /mafatih/... |
| reading_completion_logs (844) | contentType mafatih/nahj/sahifa, contentId, contentTitle, contentSubtitle, date | U |  |

## Routes by feature (server/routes.ts unless noted)

- **Auth:** GET /api/auth/user (86); GET /api/auth/providers, /api/login/google, /api/callback/google, /api/login/apple, POST /api/callback/apple, POST /api/auth/exchange, POST /api/auth/revoke (oauth.ts:297-400); Replit OIDC GET /api/login, /api/callback, /api/logout (replitAuth.ts:114-130); DELETE /api/auth/account (308) does a transactional cascade delete (storage.ts:491) to meet Apple guideline 5.1.1(v).
- **Profile/device:** GET /api/user (353), PATCH /api/user/birth-year (290), POST /api/user/device (324).
- **Settings:** GET/PATCH /api/settings (251/271). GET creates the row with defaults when it is missing.
- **Prayer logs:** GET /api/prayer-logs, GET /:date, POST (upsert by date), PATCH /:id (102-183).
- **Moods:** GET/POST /api/moods (210/223).
- **Tasbih:** sessions GET/POST (369/382). Counters: GET auto-creates or upgrades the default, POST, PATCH /:id, DELETE /:id, POST /:id/activate (422-583).
- **Quran:** progress GET/POST (600/612). Proxy GET /api/quran/chapters and /api/quran/pages/:page (1-604) to api.quran.com v4, with an in-memory cache (quran.ts:3,62,84).
- **Favorites:** GET, POST, DELETE /:itemType/:itemId (652-688).
- **Habits:** CRUD /api/habits (710-781); habit-logs GET /:date, POST (799/811).
- **Focus:** /api/focus-logs GET /:date, GET, POST, DELETE /:prayer/:date (839-888).
- **Personal analytics** (per user): /api/analytics/overview, weekly, habit-streaks, tasbih-totals, mood-distribution, heatmap (default 84 days), distractions (905-980).
- **Packages (برامج):** public GET /api/habit-packages (active only) and /:packageId/items (1638/1649). Subscriptions: GET /api/user-habit-packages, POST /:id/subscribe, DELETE /:id/unsubscribe, PATCH /:id/toggle (1734-1846). Custom packages: /api/user-custom-packages CRUD plus items CRUD (1873-2104). GET /api/user-prayer-items (2124). /api/prayer-item-logs GET ?date and POST /toggle (2136/2152).
- **Learning:** GET /api/learning-modules, /:id, POST /:id/progress (1300-1344). It is also registered a second time as public at 1661.
- **Library:** GET /api/library-assets, /:id, /:id/content (proxy stream, 1673-1698).
- **Events:** GET /api/events?date&speaker, /speakers, /counts?startDate&endDate, /:id (2176-2227).
- **Calendar occasions:** GET /api/calendar-events, /month/:month (2946/2956).
- **App settings:** GET /api/app-settings returns a key→value map; GET /:key (2307/2321).
- **Tracking:** POST /api/track (2353, anonymous allowed).
- **Contact:** POST /api/contact (2474, rate-limited by IP hash, guests allowed).
- **Daily content:** GET /api/daily-content-config, /:day (2600/2611).
- **Reading completion:** POST, GET, GET /:date /api/reading-completion (2661-2698).
- **Push:** GET /api/push/vapid-public-key, POST subscribe, POST unsubscribe, GET status (2724-2787).
- **Object storage** (replit_integrations/object_storage/routes.ts): POST /api/uploads/request-url (38) returns a presigned GCS URL; GET /objects/:path (73) serves files, with ACL checked via the `custom:aclPolicy` metadata key (objectAcl.ts).

## Admin (`isAdmin` checks the admin_users row, routes.ts:58)

Admin.tsx has 9 tabs (Admin.tsx:138-162): analytics, packages, events, occasions, daily, learning, library, notifications, messages. There is also a HijriCalendarSettings card (2268) that sets `hijri_date_offset`.

- GET /api/admin/check (997)
- habit-packages and habit-package-items CRUD (1014-1137)
- learning-modules and slides CRUD (1154-1283)
- library-assets CRUD (1371-1432)
- notification-templates CRUD plus /publish, /schedule, /status/:status, /duplicate (1449-1620)
- events CRUD (2245-2296)
- POST /api/admin/app-settings (2331)
- analytics: summary, popular-sections, daily-active-users (days & offset), feature-usage, retention (cohortDays), events-by-type, guest, devices, ages (2372-2460)
- contact-messages list, unread-count, PATCH status (2551-2573)
- daily-content-config upsert/delete (2623/2642)
- POST /api/admin/push/test (2802)
- calendar-events CRUD (2860-2925)

## Business rules

- **Prayer streak** (routes.ts calculateStreak, near the end of the file): a day counts only when all five prayers are done. The streak is today plus consecutive earlier complete days. It is computed only when a log is first created; a later upsert does not recompute streakCount (142-178).
- **Tasbih al-Zahra** (تسبيح الزهراء): the default counter "tasbih_zahra" is always created and always listed first. It cannot be deleted, renamed, or switched to another mode. Older counters are recognised by name, e.g. "tasbih fatimah" (410-583). In traditional mode sequenceStep runs 0/1/2, which is the 34-33-33 sequence; the counts themselves are enforced in the client.
- **Package subscriptions:** at most 5 in total, at most 1 admin "general" package and at most 1 "seasonal" package. A custom package can be subscribed to only by its creator. Error codes: ALREADY_SUBSCRIBED, MAX_PACKAGES_REACHED, MAX_GENERAL_REACHED, MAX_SEASONAL_REACHED (1745-1830).
- **Hijri offset:** the effective offset is the admin `hijri_date_offset` plus the user's `hijriDateOffset`. Guests get only the admin offset (Prayer.tsx:93-97, Home.tsx:51-57).
- **Prayer calculation methods** (prayerScheduler.ts methodParams):
  - shia: Fajr 18°, Isha 17°, Maghrib 4° below horizon
  - sunni: sunset 0.833°
  - hanafi: Asr factor 2
  - ibadi: Isha 18°
  - Dhuhr = solar transit + 1 min

## Notifications / jobs (J)

- `startPrayerScheduler` (prayerScheduler.ts) runs only when VAPID keys are set. VAPID contact is mailto:admin@alrisali.app.
  - Every 30 s, for each user with a push subscription, prayerNotificationsEnabled, and lat/lng: compute the times, skip prayers listed in disabledNotificationPrayers, and fire at prayer time minus notificationMinutesBefore.
  - Title "{ar} - {en}", body "حان وقت صلاة …".
  - Expired subscriptions (404/410) are pruned.
- Every 60 s, scheduled templates whose scheduledAt has passed are published and broadcast to every subscription where generalNotificationsEnabled is not false. Publishing by hand (routes.ts:1523) broadcasts the same way.
- Transport is **Web Push (VAPID) only**: no APNs or FCM code exists in server/. Native scheduling happens on the device (Home.tsx:111 schedulePrayerNotifications).

## Auth / account linking (X)

- Three providers: Replit OIDC (legacy), Google, Apple.
- Account linking (oauth.ts:69-127), in order:
  1. Match on provider id.
  2. Otherwise link to an existing user with the same lowercased email. Google's email is used only when `email_verified` is true.
  3. Otherwise create a new user.
- Native flow: `?client=native&code_challenge=…` → deep link `alrisali://auth?code=` → POST /exchange with the verifier → 1-year bearer token. `isAuthenticated` accepts either the session cookie or the bearer token.
- Apple sends the user's name only on the first authorization. The Apple client secret is an ES256 JWT.

## Static/scripts (S)

- scripts/scrape_mafatih.{js,cjs} and parse_mafatih.cjs: one-off extraction of Mafatih al-Jinan duas from /tmp/mafatih_full.txt into bundled data (Kumayl, Tawassul, Sabah, Arafah, Iftitah, Jawshan, Samat…).
- generate-mushaf-meta.mjs builds mushaf page metadata.
- verify-*.ts are checks for the prayer-recognition matcher.
- scripts/sql/2026-07-14-auth-schema.sql: idempotent patch adding google_id/apple_id, api_tokens and auth_exchange_codes.

## Flags / dead code / defects

- `userSettings.language` is read in prayerScheduler.ts and routes.ts:1554, but no such column exists, so pushes are always in Arabic.
- `targetAudience` and `admin_users.role` are stored but never used.
- /api/learning-modules is registered twice, at 1300 (auth plus progress) and at 1661 (public). Express runs the first match, so the public one is shadowed.
- DELETE /api/habits/:id (781) calls deleteHabit(id) without checking userId [INFERENCE: IDOR, so any user could delete another user's habit; storage code not read].
- POST /api/uploads/request-url has no isAuthenticated (object_storage/routes.ts:38).
- The scheduler estimates the timezone as round(longitude/15), with no DST or real tz.
- The template-sending loop is duplicated between routes.ts:1523 and prayerScheduler.ts.
- The isAdmin/admin-check routes leave console.log debug lines.

## Ambiguous terms

- "events" (gatherings table) vs "calendar_events" (Hijri occasions; the Admin tab is called "occasions").
- habit_packages = "packages" / "programs" / "custom package".
- "prayer items" = package items linked to a prayer.
- Three overlapping prayer-notification lists: mutedPrayers, disabledNotificationPrayers, voiceNotificationPrayers. hiddenPrayers is a separate display-only list.
- Hijri offset exists at two levels: admin `hijri_date_offset` and the user's `hijriDateOffset`.
- tasbih "sessions" vs "counters".
- "analytics" is both the user's own stats and the admin dashboard.
