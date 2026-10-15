# Content & Engagement Feature Inventory (Alrisali web → RN/Expo port)

Scope: Library/Quran/Sahifa/Mafatih/assets, Learn, Tasbih, Habits/packages, moods, favorites, settings, guest mode, offline sync, i18n, admin, Feed, Contact/Privacy/Terms, auth transport. Evidence = file:line.

## 0. Routing / liveness

- Unauthed + not guest: only `/`(Landing), `/privacy`, `/terms`, `/contact` (App.tsx:106-110). Native auto-enters guest mode, skips Landing (App.tsx:75).
- Authed/guest routes App.tsx:119-142. **NOT ROUTED (dead):** `pages/Quran.tsx` (hardcoded 14 surahs, non-functional filter chips "Last Read/Favorites/Juz/Page", English-only), `pages/Feed.tsx` (hardcoded 5 mock items: Nouman Ali Khan / Mufti Menk – Sunni speakers, mock "views"). Drop both.
- Bottom nav (layout/MobileLayout.tsx:7-17): home, habits, library, tasbih, prayer, events, analytics; user-configurable via `userSettings.navItems`; "home" always forced. **Inconsistency:** client default `[home,habits,library,tasbih,analytics]` vs DB default `[home,habits,library,events,analytics]` (shared/schema.ts navItems).

## 1. Library hub (المكتبة) — pages/Library.tsx

- Tabs/sections: Quran surah list (server), Books (bundled Mafatih + Sahifa), admin Library Assets, Favorites (المفضلة). Single search box filters surahs (name/number), books (title/author), assets (titleEn/Ar, authorEn/Ar) (Library.tsx:67-149).
- Favorite toggle: guest → triggers signIn; else add/remove `favorites{itemType,itemId,itemTitle,itemSubtitle}` (Library.tsx:80-106). Server-only.
- Nahj al-Balagha (نهج البلاغة): **only locale strings** (`library.nahj.*`, sermons/letters/sayings) — no data, no route, no reader. Spec asked for it (EXTRA FEATURE spec §4). Unimplemented.

## 2. Quran reader (القرآن الكريم) — pages/QuranReader.tsx, lib/quranApi.ts, server/quran.ts

- Route `/quran/:id` where **id = mushaf PAGE 1..604** (QuranReader.tsx:18,98-104), not surah. (Dead Quran.tsx links `/quran/{surahNumber}` — conflicting meaning of `:id`.)
- Mushaf page rendering: QCF v2 per-page fonts loaded from `https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p{page}.woff2` (QuranReader.tsx:140); line-by-line justified via scaleX; falls back to plain text before font loads.
- Data: server proxies `https://api.quran.com/api/v4` with in-memory cache (server/quran.ts:3-4,62,84); `/api/quran/chapters`, `/api/quran/pages/:page` → verses with words {glyph,text,line,translation,transliteration,audioUrl}. Word audio = `https://audio.qurancdn.com/{path}` (quran.ts:124) — exposed in data, [INFERENCE] not played in reader.
- Features: tap word → shows text/translation; toggle verse translations (HTML stripped); font size ±2 (16–52); prev/next page; header surah/juz from bundled `data/mushafMeta.json` (604 entries `{page,juz,surahNumber,surahAr,surahEn}`).
- NOT present: reciter audio, bookmarks, last-read, search, notes, offline. `quran_progress` table + `useUpdateQuranProgress` exist but **never written**; Analytics reads it (Analytics.tsx:55) → always empty. Dead.
- Home "verse of the day": per weekday surah/ayah from locales `verse.{day}`, audio from `https://everyayah.com/data/Alafasy_128kbps/SSSAAA.mp3` (Home.tsx:207).
- Port: needs server only as proxy (or call quran.com/Quran Foundation directly; content API licensing). Purely read-only global data.

## 3. Sahifa Sajjadiyya (الصحيفة السجادية) — SahifaBrowser/SahifaReader

- Bundled `data/sahifaSajjadiyya.json`: `{title,titleArabic,author,authorArabic,sections[3]{id,title,titleArabic,items[]{id,number,title,titleArabic,contentArabic,translationEnglish}}}`, 76 items total.
- Routes `/sahifa`, `/sahifa/:sectionId/:itemId`. Reader: font 14–32 (default 18), show Arabic/English/both, favorite (auth), "mark complete" (أكملت القراءة) → `reading_completion_logs{contentType:"sahifa",contentId,contentTitle,date}`, Recite-Along toggle (SahifaReader.tsx:8-31,134-231).

## 4. Mafatih al-Jinan (مفاتيح الجنان) — MafatihBrowser/MafatihReader

- Bundled `data/mafatihAlJinan.json`: 5 chapters (taqibat, daily-supplications, daily-ziyarahs, famous-supplications, daily-adhkar), 35 sections `{id,title,titleArabic,arabic,(english)}`.
- `data/mafatihAlJinan_full.json` (14 chapters with **duplicate ids** chapter-1/2/3) is **unreferenced anywhere** — dead/bad data. Browser has icon for chapter "quranic-surahs" that doesn't exist (MafatihBrowser.tsx:12).
- Routes `/mafatih`, `/mafatih/:chapterId`, `/mafatih/:chapterId/:sectionId`; browser search over chapters/sections; reader identical to Sahifa (font, lang toggle, favorite, complete, Recite-Along) (MafatihReader.tsx:8-225).
- Admin `daily_content_config` maps weekday+contentType ("dua","ziyarat","prayer","commonDuas","tonightsDua") → in-app route like `/mafatih/daily-supplications/sunday-supplication` for Home cards (schema.ts dailyContentConfig). Coupling: route strings are de-facto content IDs; port must keep stable IDs.
- .firecrawl/*.json = scraped raw pages (al-islam.org Sahifa daily supplications, munajat, sahifa index/sources, quran-libraries GitHub search) — source material, not runtime.

## 5. Recite-Along (تلاوة مع) — components/ReciteAlong.tsx, lib/reciteMatcher.ts, lib/arabicNormalize.ts, lib/continuousSpeech.ts

- Used in Sahifa/Mafatih readers on Arabic text. Words fade dark→gold as "recited".
- Modes: hold (press-and-hold advances), auto (pace slow 1100ms/normal 750/fast 480 per word), voice (mic), hybrid (voice + touch override). Position (`count`) never goes backwards except explicit restart (ReciteAlong.tsx:1-36).
- Settings persisted in localStorage: `reciteAlong.mode|pace|touchBehavior|pauseHintSeen`.
- Speech: Web Speech API `SpeechRecognition`/webkit, continuous+interim, lang list fallback (continuousSpeech.ts:19-78). **No native plugin** → port needs expo speech recognition module (e.g. ar-SA on-device).
- Matching: normalize (strip tashkeel/tatweel/punct, unify أإآٱ→ا, ة→ه, ى→ي, ؤ→و, ئ→ي); tokens w/o Arabic letters rendered but unmatched; fuzzy = edit distance ≤1 plus stripping fused prefixes (ال,و,ف,ب,ل,ك,س); window of 8 upcoming words to skip misses (reciteMatcher.ts:10-37). Pure local logic — port verbatim.

## 6. Library assets (admin uploads) — AssetViewer.tsx

- `library_assets{titleEn/Ar,authorEn/Ar,descriptionEn/Ar,category(quran|hadith|dua|fiqh|history|general),fileUrl,coverImageUrl,fileType(pdf|epub|json|audio|video),fileSize,isPublished,displayOrder,downloadCount}`.
- Viewer: PDF via react-pdf (worker from unpkg); JSON fetched from `/api/library-assets/:id/content` and rendered generically for 3 shapes: `chapters[].sections[]` (Mafatih-like), `sections[].items[]` (Sahifa-like, also snake_case `title_ar/text_ar/text_en/section_id`), or `{arabic,english,content}`; else raw JSON dump. EPUB = "coming soon" placeholder (AssetViewer.tsx:694-706). Font 12–32. Per-item scroll position saved `reading-progress-{assetId}-dua-{index}` in localStorage.
- Needs server (admin content + object storage upload, ObjectUploader/use-upload).

## 7. Learning modules (تعلّم) — Learn.tsx, LessonViewer.tsx

- `learning_modules{titleEn/Ar,contentEn/Ar,category(aqeedah|fiqh|akhlaq|history|general),type(article|video|audio|quiz),mediaUrl,thumbnailUrl,isPublished,displayOrder}` + `module_slides{moduleId,slideOrder,imageUrl,captionEn/Ar}` + `user_module_progress{lastSlideIndex,completedAt}`.
- Viewer = image slide carousel (Embla, RTL-aware); every slide change POSTs progress; reaching last slide or "Mark complete" sets completed (LessonViewer.tsx:32-75). `type`/quiz/mediaUrl unused in viewer [INFERENCE: only slides rendered].
- Bug: Learn list progress bar assumes 10 slides (`lastSlideIndex/10`, Learn.tsx:100). `/learn` not in nav; reachable via links.

## 8. Tasbih (المسبحة / تسبيح فاطمة الزهراء ع) — Tasbih.tsx

- Counters: `{id,name,mode:"traditional"|"open",count,sequenceStep 0..2,customTarget?,isActive,isDefault}`; DB `tasbih_counters` (+sortOrder). One **default** counter key `tasbih_zahra` — cannot be deleted/renamed, always first, forced traditional; legacy names ("tasbih fatimah", "tasbih al-zahra", Arabic تسبيح+زهراء) normalized to it (Tasbih.tsx:59-118).
- Traditional sequence (Tasbih al-Zahra): **Allahu Akbar 34 → Alhamdulillah 33 → Subhanallah 33** (Tasbih.tsx:249-253). On reaching target: heavy haptic, 500ms later advance step; after step 3 → (signed-in) auto-save `tasbih_sessions{dhikrType,count:100}` and reset to step 0 (Tasbih.tsx:290-329). Light haptic per tap (Capacitor haptics, fallback vibrate).
- Open counters: unlimited increments; `customTarget` stored but **not enforced in UI** [INFERENCE from grep: only mapped]. Manual "save session" posts current count then resets (Tasbih.tsx:389-399). Reset requires confirm.
- Guest vs signed-in: guest = localStorage `tasbih-counters-state` (migrates legacy `tasbih-counter-state`); signed-in with server counters = every tap PATCHes server (no debounce). Signed-in with zero server counters falls back to local storage — local/guest counters are **never migrated** to server on sign-in.
- Spec gaps (TASBIH NEW FORMAT spec): CSV/JSON export, intention/notes, optional sound, step sizes — not implemented.

## 9. Habits / Worship (الاعمال و العبادات) — Habits.tsx (2579 lines), WorshipItemModal.tsx

- Guest: whole page replaced by GuestPrompt (Habits.tsx:62-77). **Bug:** hooks declared after this early return (rules-of-hooks violation).
- Date navigation: any past date, not future (Habits.tsx:96-115).
- Five daily prayers checklist → `prayer_logs{date,fajr,dhuhr,asr,maghrib,isha,streakCount}`; uncheck needs confirm. **Streak rule (server/routes.ts:2970-3010):** if all 5 done for that date → 1 + consecutive previous days with all 5 done; any incomplete day → 0. Computed on create only.
- Focus logs per prayer: `focus_logs{prayer,date,focusLevel(slider, default 7),distractions[],customDistraction}`.
- Personal habits: `habits{name,labelKey,isDefault,frequency(daily|specific_days|one_time),days[0=Sun..6],reminderEnabled,reminderTime HH:MM,isArchived,descriptionEn/Ar}`; defaults seeded (Read Quran 1 page, Morning/Evening Adhkar, Drink Water) via `habitsSeeded`; `habit_logs{habitId,date,completed}`.
- Packages (حزم): admin `habit_packages{nameEn/Ar,descriptionEn/Ar,category general(عام)|seasonal(موسمي)|custom,icon,isActive,displayOrder,createdByUserId(null=official),startDateHijri/endDateHijri "d/m/yyyy"}`; items `habit_package_items{frequency daily|specific_days|specific_date,days,specificDate,timing pre|post|general (legacy before_prayer/after_prayer),linkedPrayer,itemType regular|dua|prayer, dua* fields (arabic,english,transliteration,instructions,audioUrl), prayer* fields (prayerKey,rakaatCount,prayerSteps,prayerAdhkar,requiresWudu)}`.
- Subscriptions `user_habit_packages{isActive}` (pause/unpause). User custom packages (multiple) reuse habit_packages with createdByUserId.
- Visibility rule per date (Habits.tsx:213-275): seasonal package shown only within Hijri start..end (inclusive, compared y/m/d using `gregorianToHijri`); item daily → always; specific_days → weekday match; specific_date → exact ISO date.
- Completion: `prayer_item_logs{itemId,prayerId,date,completed,completedAt}` toggled via `/api/prayer-item-logs/toggle`. WorshipItemModal shows dua text/transliteration/audio or prayer steps; completing never un-toggles (WorshipItemModal.tsx:63-72).
- Onboarding flags in localStorage: `onboarding-packages-seen`, `onboarding-focus-seen`, `seen-package-ids` ("new package" badges).
- "Modern mode" (`notificationMode==="modern"`) changes copy/UI (SpiritualCompanion, character xp/level/type).

## 10. Moods & dua suggestions — Home.tsx:134-180

- 5 moods: happy, neutral (labelled "calm"), sad, stressed, angry. On select → `moods{moodType,remedy}` with remedy = random saying from lib/notification-data `getSayingForMood` (theme mapping) else locale `duaRemedies.{mood}` (e.g. sad → "إنا لله وإنا إليه راجعون", stressed → Surah al-Sharh). Schema also has `intensity`, `moodDate` unused by UI. Server (signed-in) only; offline queue supports `mood` type but no producer.

## 11. Favorites

- `favorites{itemType,itemId,itemTitle,itemSubtitle}`; used for surahs/books/assets (Library) and Sahifa/Mafatih items. Server only; guest → sign-in.

## 12. Settings — Settings.tsx, shared/schema.ts userSettings, lib/guestSettings.ts

- userSettings fields: notificationMode classic|modern, emotionalTone, morning/midday/eveningTime, quietHours*, location/latitude/longitude, calculationMethod (default "shia"), navItems, xp/characterLevel/characterType, prayer/generalNotificationsEnabled, notificationSound (adhan_makkah), notificationMinutesBefore 5, mutedPrayers, habitsSeeded, hijriDateOffset (−2..+2), imsakMinutesBefore 10, hiddenPrayers (default imsak,asr,sunset,isha), voiceNotificationPrayers, disabledNotificationPrayers, fontSize small|medium|large, timeFormat 12h|24h (default 24h), prayer-assistant pace (prayerPacePreset, HoldMs 300–2500, TashahhudMs 1000–8000, PulseMs 500–3000, BowSensitivity 0–100 default 70).
- UI exposes: message style, character theme, nav items, location (GPS / Nominatim city search), Hijri personal adjustment, font size (applies html class `font-size-*`), time format, prayer/general notifications, sound, minutes-before, dark mode (localStorage `theme`, not synced), language.
- Guest settings: localStorage+Capacitor Preferences `nur_guest_settings` {lat,lng,location,calculationMethod,imsakMinutesBefore,hiddenPrayers,fontSize,timeFormat} (guestSettings.ts:3-16). Font/time are written to guest store even for signed-in users. Not migrated on sign-in [INFERENCE].

## 13. Auth & guest mode — hooks/useAuth.ts, lib/serverComm.ts, Landing.tsx

- Guest flag localStorage `nur_guest_mode`; auto-exits if a session user exists. Landing: Guest / Google / Apple / legacy Replit Auth.
- Native: API base `VITE_API_BASE_URL` || `https://alrisali.com`; global fetch interceptor rewrites `/api` + bearer token (Preferences `alrisali_api_token`); sign-in via system browser + PKCE → deep link `alrisali://auth?code=` exchanged for token (serverComm.ts). Web uses cookie session.
- Device tracking once per session (`nur_device_tracked`), `user_devices`; birth year for age analytics.
- GuestBanner hidden on native (GuestPrompt.tsx:58). Guest-gated: habits, analytics, favorites, settings sync, reading completion, tasbih session save.

## 14. Offline sync — hooks/useOfflineSync.ts, lib/offlineStorage.ts

- Storage = Capacitor Preferences keys: `offline_prayer_logs` (map by date), `offline_settings_cache`, `offline_habits_cache`, `offline_habit_logs_cache`, `offline_sync_queue`.
- On mount seeds React Query cache (settings, today prayer log, habits, today habit logs); mirrors live query results into Preferences; on `online` event drains queue FIFO, replaying POST/PATCH; failures stay queued (useOfflineSync.ts:40-69).
- Producers only when `!navigator.onLine`: prayer_log, settings, habit_completion (api.ts:29-34,105-113,358-386). Queue types tasbih_session & mood have **no producers**. No conflict resolution, no idempotency (replays POST; prayer log create recomputes streak).
- queryClient: staleTime Infinity, no retry, 401 → null (queryClient.ts).

## 15. i18n / RTL — i18n.ts, locales/

- i18next; default language **ar**; key `app-language`; sets `dir`/`lang` on html. en & ar each 25 top-level domains: common, home, settings(91), prayer, habits(96), quranReader, textReader, library, tasbih(47), analytics(94), calendar, days, duaRemedies, verse, toast, character, eventsPage, landing, guest, privacy, terms, contact, pwa, onboarding, mafatih.
- Many pages use inline `isArabic ? … : …` strings or `t(k) || 'fallback'` (keys like `learn.*` absent from locale domain list → fallback English). Content data is bilingual fields (*En/*Ar, title/titleArabic, contentArabic/translationEnglish) — naming inconsistent.

## 16. Admin panel — Admin.tsx (9 tabs, gated by `admin_users` role admin|superadmin)

analytics (summary, popular sections, DAU, feature usage, retention, guest, device, age), packages (+items, itemType regular|dua|prayer, sunnah prayer presets fajr_sunnah…tahajjud,duha), events (`events`: type celebration|mourning|lecture|other, genderAccess both|male|female, venue/geo, sheikh, livestream), occasions (`calendar_events` Hijri day/month; global Hijri offset app setting), daily content (weekday→route), learning (modules+slides), library assets (upload), notifications (`notification_templates` key, category, tone, status draft|published|scheduled, audience all|active_users|new_users; publish/schedule/duplicate), messages (contact inbox, status new|read|replied|archived, unread badge). Usage telemetry `analytics_events` via usePageTracking → `/api/track` (page_view).

## 17. Contact / Privacy / Terms

- Contact form → `/api/contact` (name 2–100, email, subject 3–120, message 10–3000; ipHash rate-limit), guests allowed. Privacy cites Google/Apple sign-in and OSM Nominatim; no third-party analytics (Privacy.tsx:152).

## Server-dependency summary

Server/global: Quran proxy, library assets, learning modules, habit packages, daily content config, calendar events/events, notification templates & push, admin, contact, analytics, auth. Per-user (synced, could be local-first): prayer logs/streak, focus logs, habits/logs, prayer item logs, subscriptions/custom packages, tasbih counters/sessions, moods, favorites, reading completions, module progress, settings. Pure local: Sahifa/Mafatih text, mushaf meta, recite-along, theme, language, onboarding flags.

## Ambiguous / inconsistent terms

- "Habits" vs "Worship/Acts" (UI ar: الاعمال و العبادات) vs "packages" vs "prayer items" (`useUserPrayerItems` = package items, not salat) vs "activities" (spec).
- `prayer_item_logs.prayerId` vs item `linkedPrayer` vs `prayerKey` (three names for prayer slot).
- `/quran/:id`: page number (reader) vs surah number (dead Quran.tsx).
- Mood "neutral" labelled "calm".
- Tasbih "session" (completed set/manual save record) vs "counter" (persistent state).
- timing `pre/post` vs legacy `before_prayer/after_prayer`.
- "events" (gatherings table) vs "calendar_events"/"occasions" (Hijri commemorations).
- Content bilingual field naming: `titleArabic` vs `titleAr` vs `title_ar`; `english` vs `translationEnglish` vs `text_en`.
- Package category enum includes `custom` but admin UI only offers general/seasonal.
