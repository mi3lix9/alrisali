# الرسالي (Al-Risali)

A Shia-aligned spiritual companion: prayer times and tracking, devotional texts, dhikr, and daily acts of worship for one believer, with a small body of content published by the Al-Risali team.

## People

**Believer**: A person using the app, whether signed in or not. _Avoid_: Customer, member

**Guest**: A Believer who has not signed in; their records live only on their device. _Avoid_: Anonymous user, visitor

**Admin**: A member of the Al-Risali team who publishes Content and reads Contact Messages. _Avoid_: Superadmin, moderator

## Prayer

**Salah**: One of the five obligatory daily prayers: Fajr, Dhuhr, Asr, Maghrib, Isha. _Avoid_: Prayer (when the five obligatory prayers are meant), namaz

**Prayer Time**: A computed moment in the day for a given place, on that place's own clock (its time zone, not the device's): Imsak, Fajr, Sunrise, Dhuhr, Asr, Sunset, Maghrib, Isha, Midnight. Only five of them are Salah.

**Calculation Method**: The set of astronomical and juristic rules that turns a place and date into Prayer Times: Ja'fari (the default), Sunni, Hanafi or Ibadi. _Avoid_: "shia" method

**Imsak**: The Prayer Time a set number of minutes before Fajr at which the fast begins.

**Hidden Prayer Time**: A Prayer Time the Believer has chosen not to see on their timetable.

**Prayer Log**: The Believer's record, for one date, of which Salah they performed. _Avoid_: Prayer tracking entry

**Prayer Streak**: The run of consecutive days, ending on a given date, on which all five Salah were logged. _Avoid_: Streak (unqualified)

**Khushu**: The Believer's self-rated focus during one Salah, with the Distractions they noticed. _Avoid_: Focus log, concentration

**Distraction**: Something the Believer names as having pulled their attention away during a Salah.

**Qibla**: The direction from the Believer's location to the Kaaba.

**Prayer Assistant**: The guided companion that follows the Believer through a Salah and keeps count of Rak'ahs and Positions. _Avoid_: Prayer recognition, pose tracker

**Recognition Mode**: How the Prayer Assistant senses the Believer's Position: Camera, Head Height, Sound (Takbir) or Mat.

**Position**: A posture within a Rak'ah: Qiyam, Ruku, I'tidal, Sujud, Jalsa, Tashahhud. _Avoid_: Pose, step

**Rak'ah**: One complete cycle of Positions; each Salah has a fixed number (Fajr 2, Dhuhr 4, Asr 4, Maghrib 3, Isha 4). _Avoid_: Unit

**Takbir**: The utterance "Allahu Akbar" that marks transitions in a Salah.

**Pace**: How long the Prayer Assistant waits in each Position before moving on: Slow, Normal, Fast or Custom.

**Salah Definition**: A prayer the Prayer Assistant follows, as data: its Segments in order, each with its Rak'ahs, Ruku per Rak'ah (five in the Ayat prayer) and middle Tashahhud. Covers the five Salah (optionally with their nafila), the Night prayer, Ayat, Ghufayla, Friday, Eid, Ziyarah and a Custom count. Only one that fulfils a Salah is logged.

**Segment**: One prayer within a Salah Definition, closed by its own Tashahhud and Tasleem, such as one pair of nafila, the Shaf' or the Witr. _Avoid_: Unit

**Haste Warning**: The gentle notice the Prayer Assistant shows when Positions advance less than 3 seconds apart. _Avoid_: Pace warning (Pace is the hold length)

**Qada**: Making up missed Salah or fasts. A Qada Salah the Believer logs (on the Qada dashboard or in the Prayer Log) is one record, and it never counts as the day's Salah in the Prayer Log or Prayer Streak. _Avoid_: Make-up prayer (in code)

**Qada Backlog**: What remains to be made up: missed Salah counted per Salah, and missed fasts. It is what the Believer entered, less every Qada Salah and fast they logged.

**Qada Pace**: How many Qada Salah the Believer plans each day and Qada fasts each week; it turns the Qada Backlog into today's items. _Avoid_: Pace (that is the Prayer Assistant's)

## Calendar

**Hijri Date**: The date in the Islamic lunar calendar, after applying the Hijri Adjustment.

**Hijri Adjustment**: A shift of whole days applied to the computed Hijri Date: one set by Admins for everyone, plus one the Believer adds for themselves. The Admins' one is a day offset or, after a moon-sighting announcement, a forced Hijri Date for a given day that lasts until its expiry and then falls back to the offset. _Avoid_: Hijri offset

**Occasion**: A recurring Hijri-dated commemoration (birth, martyrdom, Eid, fast) that is either a celebration, a mourning, a religious day or a fast. _Avoid_: Calendar event, munasaba (in code)

**Gathering**: A dated, located session (majlis, lecture, celebration, mourning) led by a Speaker that Admins publish for Believers to attend or stream. _Avoid_: Event

**Speaker**: The sheikh or orator leading a Gathering. _Avoid_: Sheikh (as a field name)

**Shamsi Date**: The date in the Solar Hijri (Iranian) calendar, whose year starts at Nowruz; shown only by the date converter, alongside the Hijri and Gregorian dates. _Avoid_: Jalali, Persian date

## Texts

**Quran Page**: One of the 604 fifteen-line pages of the Madinah mushaf (Hafs). _Avoid_: Quran id

**Surah**: One of the 114 chapters of the Quran.

**Page Mode**: Reading the Quran as Quran Pages, each line laid out like the printed mushaf, turned by swiping horizontally or by scrolling vertically.

**Surah Mode**: Reading one Surah at a time as continuous, reflowing text that ends with a way to go on to the next Surah.

**Last-Read Ayah**: The surah:ayah where the Believer stopped reading; Page Mode and Surah Mode both reopen at it. _Avoid_: Last-read page, Quran progress

**Book**: A devotional collection bundled with the app: Mafatih al-Jinan, Sahifa Sajjadiyya, and Nahj al-Balagha.

**Supplication**: A single readable text inside a Book (a dua, ziyarah, munajat or sermon). _Avoid_: Item, section, content

**Library Asset**: A file (PDF, audio, video, structured text) that Admins publish to the Library. _Avoid_: Upload, document

**Library**: The place where the Quran, Books, Library Assets and the Believer's Favorites are browsed.

**Favorite**: A Surah, ayah, Supplication or Library Asset the Believer has saved for quick return. _Avoid_: Bookmark

**Reading Completion**: The Believer's record that they finished reading a Supplication on a given date.

**Recite-Along**: A reading aid that highlights each word of an Arabic text as the Believer recites it, driven by hold, a timed pace, or their voice. _Avoid_: Karaoke, tilawa mode

**Daily Content**: The Supplication, ziyarah or prayer Admins feature for each weekday on Home.

**Verse of the Day**: The Quran verse, with recitation, featured on Home for each weekday.

**A'mal**: The acts of a Hijri day or month (duas, ziyarat, prayers, fasts, tasbih), each read from a Supplication; day 0 means every day of the month. _Avoid_: Deeds, acts (unqualified)

## Dhikr

**Tasbih**: A counter the Believer uses to keep count of a dhikr. _Avoid_: Counter (unqualified), masbaha (in code)

**Tasbih al-Zahra**: The permanent Tasbih that runs the fixed sequence Allahu Akbar ×34, Alhamdulillah ×33, Subhanallah ×33. _Avoid_: Tasbih Fatimah, traditional counter

**Open Tasbih**: A Tasbih the Believer names and counts freely, optionally toward a target. _Avoid_: Custom counter

**Dhikr Session**: The recorded result of one completed round of a Tasbih. _Avoid_: Tasbih session

## Worship

**Habit**: A personal recurring act the Believer sets for themselves (daily, on chosen weekdays, or once), optionally with a reminder. _Avoid_: Activity, task

**Program**: A curated bundle of Acts the Believer subscribes to: Official (published by Admins, general or seasonal) or Personal (built by the Believer). _Avoid_: Package, habit package, حزمة

**Seasonal Program**: An Official Program available only between two Hijri Dates (e.g. Muharram, Ramadan).

**Subscription**: A Believer's enrolment in a Program, which they may pause.

**Act**: One entry in a Program — a plain act, a Supplication to read, or a prayer to perform — scheduled daily, on weekdays or on a date, optionally before or after a Salah. _Avoid_: Prayer item, package item, worship item

**Act Completion**: The Believer's record that they performed an Act on a given date.

**Mood Check-in**: The Believer's record of how they feel (happy, calm, sad, stressed, angry), answered with a Remedy. _Avoid_: Mood log

**Remedy**: A saying or dua offered in answer to a Mood Check-in. _Avoid_: Suggestion

**Companion**: The character that grows with the Believer's devotion, themed as a Garden or a Traveler. _Avoid_: Avatar, character

## Notifications

**Reminder**: A notification produced from the Believer's own schedule: a Prayer Time or a Habit. _Avoid_: Push

**Announcement**: A notification Admins write once and send to many Believers, now or at a scheduled time. A sent one cannot be deleted, only archived: it leaves every device's inbox and stays on record. _Avoid_: Notification template, broadcast

**Message Style**: The voice the app speaks in: Classic (scriptural sources) or Modern (gentle, motivational coaching). _Avoid_: Notification mode, traditional mode

**At-Time Alert**: What plays when a Prayer Time arrives (off, a silent notification, the short takbir or the full adhan), chosen per Salah and for Imsak, separately from the Reminder before it. Quiet hours never hold it back. _Avoid_: Adhan notification, prayer alarm

## Learning & support

**Lesson**: An Admin-published teaching made of ordered Slides on aqeedah, fiqh, akhlaq or history. _Avoid_: Learning module, module

**Slide**: One image with a caption inside a Lesson.

**Contact Message**: A message a Believer sends to the Al-Risali team.

## App shell

**Feature Registry**: The single list of features that drives the tabs, Home shortcuts, All Tools and seasonal visibility; a seasonal feature appears only within its Hijri window. _Avoid_: Menu, feature list (for a second, hand-written one)

**Link**: An `alrisali://` or universal (web-domain) URL that opens the app at an ayah, a Supplication, a Khatmah, the Qibla, Tasbih or the next Salah, found through the Feature Registry; one that names nothing opens Home. The app-icon long-press shortcuts open the same links. _Avoid_: Deep link (as a second term), route

## Relationships

- A **Prayer Log** belongs to one **Believer** and one date; a **Prayer Streak** is derived from Prayer Logs, never entered.
- **Khushu** is recorded per **Salah** per date.
- A **Program** contains many **Acts**; an **Act** may be tied to one **Salah** and a before/after timing.
- A **Believer** holds at most five active **Subscriptions**, of which at most one General and one Seasonal **Official Program**.
- **Tasbih al-Zahra** exists exactly once per Believer and cannot be removed or renamed.
- A **Book** contains many **Supplications**; **Daily Content** points at a Supplication.
- An **Occasion** recurs every Hijri year; a **Gathering** happens once on a Gregorian date.

## Flagged ambiguities

- "Event" was used for both **Occasion** and **Gathering** — resolved: two distinct terms.
- "Prayer" was used for **Salah**, for an **Act** of type prayer, and for any **Prayer Time** — resolved: say which.
- "Package" / "program" / "habit package" — resolved: **Program**.
- "Classic" vs "traditional" notification mode — resolved: **Message Style** Classic/Modern.
- "Session" vs "counter" in tasbih — resolved: **Tasbih** is the counter, **Dhikr Session** is the record.
- "Neutral" mood displayed as "calm" — resolved: **calm**.
