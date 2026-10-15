# Prayer / Qibla / Calendar / Home / Analytics / Notifications — Feature Inventory

## 1. Prayer times (مواقيت الصلاة) — client/src/pages/Prayer.tsx, lib/prayerTimes.ts

- Hand-rolled astronomical calc (no adhan lib). Methods `CalculationMethod = 'shia'|'sunni'|'hanafi'|'ibadi'` (prayerTimes.ts:84). Params (prayerTimes.ts:94-100):
  - shia (Ja'fari, default): Fajr 18°, Isha 17°, Asr shadow factor 1, sunset 0° (geometric), **Maghrib = sun at −4°** (eastern redness gone), falls back to sunset at high latitudes (:128-134).
  - sunni/hanafi/ibadi: sunset 0.833°, Maghrib = sunset; hanafi Asr factor 2; ibadi Isha 18°.
- Outputs imsak, fajr, sunrise(0.833°), dhuhr (= transit +1 min), asr, sunset, maghrib, isha, midnight (= sunset + (fajr+24−sunset)/2) (:116-151). Imsak = fajr − `imsakMinutesBefore` (default 10).
- Spec `attached_assets/Pasted-Fajr-ub-Ja-far…txt`: recommends iḥtiyāṭ +1–2 min, manual offsets, Asr as Zuhr+interval (juristic). **Not implemented**: no ihtiyat/per-prayer manual offsets; Asr uses Sunni shadow factor 1 even for shia. Flag for port.
- Timezone = device offset (`getTimezone`). Location: Capacitor Geolocation via nativePlugins.getNativeLocation; reverse geocode & city search via **Nominatim OSM** (prayerTimes.ts:186,202). `useLocationOnResume` retries location after app foregrounds (Prayer.tsx:74).
- `getNextPrayer(times, hiddenPrayers)`, `getActivePrayer`. User toggles hidden prayers (default hidden: imsak, asr, sunset, isha — schema.ts:174).
- Guest vs signed-in: guests use localStorage `guestSettings` (lib/guestSettings.ts); signed-in use `user_settings` (latitude, longitude, location, calculationMethod, hiddenPrayers, imsakMinutesBefore, timeFormat 12h/24h).
- **Server duplicates the calc** (server/prayerScheduler.ts:277 `calculatePrayerTimesRaw`) for push — must stay in sync.
- Prayer.tsx also contains its own compass/qibla dialog (DeviceOrientation, :186-220) duplicating Qibla page.

## 2. Prayer logging & streak (صلاة / سلسلة)

- Table `prayer_logs` (schema.ts:105): date, fajr..isha booleans, streakCount. API /api/prayer-logs (GET, /:date, POST, PATCH). Offline: queued in offlineStorage (api.ts:28).
- Streak rule (server/routes.ts:2970-3008): streak = 0 unless all 5 done today; counts consecutive prior days with all 5. Computed on POST only (PATCH doesn't recompute — inconsistency risk). Analytics `currentPrayerStreak`.
- UI for logging lives in Habits.tsx (useCreatePrayerLog), Home reads `usePrayerLogByDate`.

## 3. Focus / khushu (الخشوع / التركيز)

- `focus_logs` (schema.ts:427): prayer, date, focusLevel int, distractions text[], customDistraction. API /api/focus-logs (+ DELETE /:prayer/:date). Analytics distractions breakdown (/api/analytics/distractions?days).
- `prayer_item_logs` + habit_package_items with timing pre/post, linkedPrayer, itemType regular|dua|prayer (admin packages; server-needed).

## 4. Prayer Assistant (مساعد الصلاة) — pages/PrayerAssistant.tsx

Four recognition modes (PrayerAssistant.tsx:79-83): `camera` (default pose engine), `headHeight`, `sound` (mic takbir), `mat` (phone flat on mat, front camera to ceiling; sujud covers lens).

- Pose: TensorFlow.js + `@tensorflow-models/pose-detection` **MoveNet SINGLEPOSE_LIGHTNING**, bundled model `/models/movenet/model.json` (offline) (:582-594). Camera via getUserMedia 640px. Live feed hidden by default (discouraged to watch yourself, :207).
- prayerPoseClassifier.ts: positions qiyam, ruku, itidal, sujood, jalsa, tashahhud, unknown; self-calibrating standing reference (SteadyCalibrator, 8 steady frames); `HeadHeightPoseClassifier`; `detectTakbir` (hands raised); bow sensitivity 0-100 (default 70) → thresholds; `PRAYER_POSITION_INFO` ar/en names.
- rakahStateMachine.ts: PRAYER_RAKAH_COUNT (fajr2,dhuhr4,asr4,maghrib3,isha4), intermediate tashahhud after rakah 2 for 3/4-rakah prayers; FULL_RAKAH_SEQUENCE; hold 800ms, continuation stand 450ms (floor 250), tashahhud 3000ms; pace presets slow/normal/fast/custom (pulse 1300 normal); PACE_LIMITS in shared/schema.ts (server validates). Mat: sujud probation = 2×holdMs clamped 1200–2400ms; middle-tashahhud dwell 5.5s@normal (3–9s); final tashahhud completion hold Fast 8/Normal 12/Slow 18s. Arabic ordinal rakah labels (الأولى…الرابعة).
- Mat mode: matOcclusionDetector.ts (front-camera brightness dip, SujudDipLearner per-device calibration), matSequencer.ts, matFocusLogic.ts; verified by scripts/verify-mat-focus.ts, verify-mat-detection.ts.
- Sound: takbirSpeech.ts over continuousSpeech.ts = **Web Speech API** (SpeechRecognition/webkit) — regexes `الله\s*[أا]كبر`, `اكبر`, latin (takbirSpeech.ts:28). Unsupported → manual advance. Not available in RN natively → need e.g. expo-speech-recognition.
- Settings persisted: prayerPacePreset, prayerHoldMs, prayerTashahhudMs, prayerPulseMs, prayerBowSensitivity (schema.ts:181-187). "Don't show again" camera intro stored on device. Components PrayerPostureRing, PrayerStepFocus (RollingStepList, MatActiveFocus). Purely local except settings.

## 5. Qibla (القبلة) — pages/Qibla.tsx, lib/qibla.ts

- Great-circle bearing to Kaaba (21.4225, 39.8262), haversine distance, 8-point cardinal. Compass via DeviceOrientation (iOS webkitCompassHeading, requestPermission) in nativePlugins.ts:169-200. Local only.

## 6. Hijri date & calendar (التقويم الهجري / المناسبات) — lib/hijriDate.ts, occasions.ts, pages/Calendar.tsx

- `Intl.DateTimeFormat('en-u-ca-islamic-umalqura')` with arithmetic (Kuwaiti-style) fallback (hijriDate.ts:16-40). Offset = admin `app_settings.hijri_date_offset` + user `hijriDateOffset` (Home.tsx:54, Calendar.tsx:40, Events.tsx:44).
- Static occasions list (~55 Shia occasions; types celebration|mourning|religious|fasting) in occasions.ts plus admin-managed `calendar_events` (day, month text, nameAr/En) via useCalendarEvents (server).

## 7. Events (الفعاليات) — pages/Events.tsx

- Admin `events` table (religious gatherings/mourning), speakers, counts (useEvents, useEventSpeakers, useEventCounts); day/week/month/map/list views, hijri overlay + occasions. Server-required.

## 8. Home dashboard — pages/Home.tsx

- Next prayer countdown, hijri date + today's occasions, today prayer log, mood check-in (moods table → `getSayingForMood` remedy), daily content (admin `daily_content_config` by weekday), verse audio, guest banner, admin link. Schedules local prayer notifications + habit reminders on load (Home.tsx:16).

## 9. Analytics (الإحصائيات) — pages/Analytics.tsx

- Server aggregates: /api/analytics/overview (avgFocus, habitsCompletionRate, currentPrayerStreak, quranPagesRead, weeklyChange), weekly, habit-streaks, heatmap?days, tasbih-totals, mood-distribution, distractions. Insights when streak ≥7. Guest gated (isGuest).

## 10. Spiritual companion gamification — components/SpiritualCompanion.tsx

- XP_PER_LEVEL 100; characterType garden (seedling≤1, sprout≤3, bloom≤5, tree≤8, garden) / traveler (seeker, wayfarer, pilgrim, guidingLight, travellingSpirit). Fields user_settings.xp, characterLevel, characterType. **DEAD-ish: nothing awards XP or increments level** (no writes found in client/server). Rendered only in Habits.tsx:960.

## 11. Notifications

- Mode: user_settings.notificationMode default `"classic"` (schema.ts:150); Settings UI uses `classic|modern` default "modern" in UI (Settings.tsx:478); Home/Habits check `=== "modern"`. Spec "Modern Mode — MyPrayer Companion" + "Shia-aligned push notification library" (attached_assets). lib/notification-modes.ts uses `traditional|modern` with sources quran / +prophet,imamAli,imams — **unused (no imports)**.
- Local: notifications.ts — sounds adhan_makkah, adhan_medina, takbir…; schedulePrayerNotifications via setTimeout + Capacitor LocalNotifications; minutesBefore (default 5); mutedPrayers, disabledNotificationPrayers, voiceNotificationPrayers; habit reminder. Legacy `scheduleDailyNotifications` is a console.log stub; `evaluateUserEvents` tone messages (gentle/motivational/neutral).
- Push: Web Push VAPID (pushNotifications.ts; `push_subscriptions` table); server prayerScheduler.ts per-minute interval computes each user's times and sends; admin `notification_templates` (draft/published/scheduled, category, tone, audience) checked every 60s. Server-required; port to Expo push/FCM-APNs.

## Ambiguous terms

- classic vs traditional (notification mode), default classic in DB vs modern in UI.
- "shia" method id vs "Ja'fari" in docs.
- Month names: camelCase keys (hijriDate) vs "Rabi' I" strings (occasions) vs Arabic map; calendar_events.month free text.
- streak: prayer streak (stored per log) vs habit streaks (computed).
- "prayer" also used for habit package item type and prayerId in item logs.
- mood "remedy" vs saying.
