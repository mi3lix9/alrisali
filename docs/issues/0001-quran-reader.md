---
title: Quran reader — Page Mode, Surah Mode, Last-Read Ayah
labels: [ready-for-agent]
status: open
---

## Problem Statement

A Believer wants to read the Quran in the app the way they read a printed mushaf: full screen, page by page, with lines exactly where the Madinah mushaf puts them, and fully offline. Sometimes they would rather read one Surah as continuous text. Either way, they want to come back exactly where they stopped.

The old app falls short in several ways:

- It loads pages from the network through a server proxy and depends on Quran Foundation fonts that can't be bundled.
- It has only one reading style.
- It never remembers where the Believer stopped (Quran progress was never saved).
- Its chrome takes up the screen.

## Solution

A full-screen, offline Quran reader with two reading modes and one shared reading position.

- **Page Mode:** the 604 fifteen-line Quran Pages of the KFGQPC Hafs Madinah mushaf. Every line is stretched edge to edge like print, with surah header bands, basmala, ayah rosettes, and the juz, hizb and page number. The Believer turns pages either by swiping horizontally (the next page is to the left, like a mushaf) or by scrolling vertically. This is a setting.
- **Surah Mode:** one Surah per screen as reflowing text with adjustable font size. It ends with a "Next Surah" button and never moves on by itself.
- **Last-Read Ayah:** stored as surah:ayah. It is updated by paging, by scrolling, or explicitly through an ayah's long-press sheet. Both modes reopen at it, and "Continue reading" on Home and in the Library leads to it.
- **Reading screen chrome is hidden by default.** A tap shows it:
  - Top: back, index, last-read bookmark, surah, juz and page, search, Hijri calendar, settings.
  - A floating recitation pill: choose a reciter, play.
  - Bottom: return to the previous position, page or Surah scrubber, notes.

  The chrome hides again on a tap, after 4 seconds of inactivity, or when the Believer starts swiping or scrolling.

## User Stories

1. As a Believer, I want the Quran to open full screen with no tab bar or toolbars, so that nothing distracts me from the text.
2. As a Believer, I want each Quran Page to show the same 15 lines as the printed Madinah mushaf, so that my memorised page positions match what I see.
3. As a Believer, I want every line stretched to the full width of the screen, so that the page looks like a real mushaf page.
4. As a Believer, I want pages 1 and 2 (Al-Fatiha and the start of Al-Baqarah) laid out centred like the printed mushaf, so that the opening pages look familiar.
5. As a Believer, I want surah header bands and the basmala at the start of each Surah, so that I can see where each Surah begins.
6. As a Believer, I want ayah-end rosettes with Arabic-Indic numbers, so that I can track ayah numbers while reading.
7. As a Believer, I want to see the juz name and surah name in a thin header and the page number and hizb in a small footer, so that I always know where I am without opening any controls.
8. As a Believer, I want to swipe right-to-left to turn pages like a physical mushaf, so that reading feels natural.
9. As a Believer, I want the option to scroll pages vertically instead, so that I can read continuously if I prefer.
10. As a Believer, I want to choose horizontal or vertical page navigation in the reader settings and in Settings, so that the reader works the way I like.
11. As a Believer, I want to read in Surah Mode as continuous reflowing text, so that I can read a whole Surah without page breaks.
12. As a Believer, I want to change the font size in Surah Mode, so that I can read comfortably.
13. As a Believer, I want a clear "Next Surah" button at the end of a Surah in Surah Mode, so that I decide when to move on.
14. As a Believer, I want the reader never to jump to the next Surah on its own, so that I don't lose my place.
15. As a Believer, I want to switch between Page Mode and Surah Mode from the reader settings, so that I can change how I read at any time.
16. As a Believer, I want switching modes to keep me at the same ayah, so that changing modes never loses my place.
17. As a Believer, I want my Last-Read Ayah to update as I page or scroll, so that I can return without having to do anything.
18. As a Believer, I want to explicitly set an ayah as my Last-Read Ayah from its long-press sheet, so that I can mark exactly where I stopped.
19. As a Believer, I want "Continue reading" on Home and in the Library to show the surah, ayah and page of my Last-Read Ayah, so that I can resume in one tap.
20. As a Believer, I want resuming to open the page that contains my Last-Read Ayah (Page Mode), or to scroll to and highlight it (Surah Mode), so that I can find my spot instantly.
21. As a Believer, I want the Last-Read Ayah rosette shown in the accent colour, so that I can spot it on the page.
22. As a Believer, I want a single tap on the page to show the controls and another tap to hide them, so that I can reach the tools only when I need them.
23. As a Believer, I want the controls to hide by themselves after a few seconds of inactivity, so that the page returns to full screen.
24. As a Believer, I want the controls to hide as soon as I start swiping or scrolling, so that reading is never covered.
25. As a Believer, I want the controls to stay visible while a sheet is open or I'm holding the scrubber, so that they don't vanish mid-action.
26. As a Believer, I want a one-time hint on first open explaining tap and long-press, so that I discover the hidden controls.
27. As a Believer, I want a long-press on an ayah to open its sheet (set as last read, play, favorite, copy), so that I can act on a specific ayah.
28. As a Believer, I want a plain tap on an ayah to toggle the controls rather than open its sheet, so that tapping to show the controls never opens a sheet by accident.
29. As a Believer, I want to drag a page scrubber (pages 1–604) in Page Mode with a bubble showing the target page, so that I can jump far quickly.
30. As a Believer, I want the scrubber to move between Surahs (1–114) in Surah Mode, so that fast jumping works in both modes.
31. As a Believer, I want a return button showing the page I came from, so that I can go back after a jump or a search.
32. As a Believer, I want an index of Surahs and Juz, so that I can open any Surah or Juz directly.
33. As a Believer, I want to jump to a page number, so that I can open the page I'm thinking of.
34. As a Believer, I want to search Surah names and ayah text without having to type the diacritics, so that I can find an ayah from memory.
35. As a Believer, I want to pick a reciter from the recitation pill and play from the first ayah on screen, so that I can listen while reading.
36. As a Believer, I want the recitation pill to stay visible while audio plays, so that I can pause at any time.
37. As a Believer, I want recitation to stream and keep recently played audio for up to a week, so that replaying works without re-downloading.
38. As a Believer, I want to favourite an ayah and find it under Favorites in the Library, so that I can return to ayat I love.
39. As a Believer, I want to copy an ayah's text, so that I can share it.
40. As a Believer, I want a bookmark icon in the top bar that is filled when my Last-Read Ayah is on the current page, so that I know whether I'm at my spot.
41. As a Believer, I want the Hijri calendar reachable from the reader's top bar, so that I can check the date without leaving the Quran.
42. As a Believer, I want the reader in Arabic right-to-left by default and in English left-to-right when I switch, with directional arrows mirrored correctly, so that the interface reads naturally in my language.
43. As a Believer, I want a pure black background with off-white text in dark mode, so that night reading is comfortable.
44. As a Believer, I want the whole Quran available offline from the first launch, so that I can read anywhere without a connection.
45. As a Guest, I want my Last-Read Ayah and favourite ayat kept on my device, so that I can use the reader fully without signing in.
46. As a Believer who signs in, I want my Last-Read Ayah and favourite ayat to sync to my own database, so that they follow me to my other devices.
47. As a Believer using two devices, I want the most recent Last-Read Ayah to win, so that resuming always uses my latest position.
48. As a Believer, I want the app to credit KFGQPC and Quran.Foundation in Sources & Credits, so that the sources are acknowledged.
49. As a Believer with accessibility needs, I want controls labelled for screen readers and ayah text readable by VoiceOver/TalkBack, so that I can use the reader without seeing it.
50. As a Believer, I want page turns and scrolling to stay smooth across all 604 pages, so that reading never stutters.

## Implementation Decisions

- **Text and layout source (ADR-0004):**
  - Use the KFGQPC Hafs v30 developer release: the Unicode text, the page and the first and last line for every ayah, the matching Uthmanic Hafs font (shipped unmodified), and the full-mushaf PDF.
  - Use the non-"smart" build.
  - Hafs only. Other riwayat are a later data-only change.
  - No translations.
- **Content build pipeline** (the bundled content package):
  - A one-time build step derives where each ayah breaks across lines, for every multi-line ayah. It reads the word positions from the PDF's text layer; if that is missing, it fits words to the font's widths within the ayah's known line range and checks the result against the PDF.
  - Output: a compact bundled dataset of pages → lines → word ranges, plus surah and juz metadata.
  - The KFGQPC notice ships with it, and Sources & Credits lists it.
- **Quran reader model** (the domain package; pure TypeScript, no React Native or IO): the single source of reader behaviour. The UI renders its outputs and forwards gestures to it. Responsibilities:
  - Look up the page holding an ayah, the ayat on a page, the lines of a page (word ranges and line kind: ayah, surah header, basmala), and the juz and hizb for a page.
  - Navigate: next and previous page (bounded 1–604), next and previous Surah (bounded 1–114), the Surah Mode end state that offers "Next Surah".
  - Follow Last-Read Ayah rules:
    - Paging or scrolling sets it to the first visible ayah.
    - An explicit set from the ayah sheet overrides it.
    - A mode switch resolves the same ayah in the target mode.
  - Remember the return position: the position before a jump (scrubber, index, search, page jump) becomes the return target.
  - Compute the scrubber domain per mode: pages in Page Mode, Surahs in Surah Mode.
  - Search Surah names and ayah text, ignoring Arabic diacritics.
  - Run the chrome visibility state machine:
    - A tap toggles the chrome.
    - Inactivity hides it after 4 seconds.
    - The start of a swipe or scroll hides it.
    - An open sheet or a held scrubber pins it open.
    - A long-press on an ayah opens that ayah's sheet and never toggles the chrome.
- **Reader state shape**, taken from the prototype:

  ```ts
  type AyahKey = `${number}:${number}`; // surah:ayah
  type QuranReaderState = {
    mode: "page" | "surah";
    pageNav: "horizontal" | "vertical"; // user setting
    currentPage: number; // 1..604
    currentSurah: number; // 1..114
    lastReadAyah: AyahKey | null;
    returnTo: AyahKey | null;
    chromeVisible: boolean;
  };
  ```

- **Persistence (ADR-0001, ADR-0002):**
  - `lastReadAyah` and favourite ayat live in the Believer's per-user database, synced; for Guests they stay on the device.
  - `pageNav`, the reading mode and the Surah Mode font size are Believer settings in the same database.
  - The schema change is additive only.
  - Favourite ayat reuse the Favorite concept, with the item kind "ayah" and an AyahKey.
- **Native UI:**
  - The reader is a full-screen route that hides the native tabs and the status bar.
  - Page Mode horizontal is a right-to-left paging list with one page per screen; vertical is a virtualised list of pages.
  - Line justification: measure each line and stretch it to full width (React Native's `justify` handles Arabic poorly).
  - Chrome overlays are absolutely positioned, with no layout shift.
  - Sheets: ayah sheet, reader settings, index, page jump, search.
  - RTL is set with expo-localization `forcesRTL`. Directional icons are mirrored per locale.
- **Recitation:**
  - Stream from the Quran Foundation audio API, with a reciter list.
  - Played files are cached for at most 7 days.
  - Playback starts at the first visible ayah.
  - The pill is shown with the chrome and stays visible while audio plays.
- **Entry points:** "Continue reading" cards on Home and in the Library; the Library Quran list of 114 Surahs, Juz index and page jump.

## Testing Decisions

- **What a good test is:** it exercises behaviour through the public interface of a seam, as a consumer would see it. No assertions on internals, wiring or copies of data. Tests must be deterministic and must run as part of the full suite.
- **Seam 1, the Quran reader model** (main seam; Vitest), fed the real bundled layout dataset:
  - Page and ayah lookup at boundaries: 1:1, 2:1, 114:6, page 604, ayat spanning two pages.
  - Navigation bounds.
  - Last-Read Ayah transitions: paging, scrolling, explicit set, mode switch in both directions.
  - Return-position behaviour after each kind of jump.
  - Scrubber domains.
  - Search ignoring diacritics.
  - Every chrome state machine transition: tap, inactivity timeout with fake timers, swipe or scroll start, pinning by a sheet or the scrubber, long-press.
- **Seam 2, content dataset integrity** (Vitest), over the generated dataset:
  - Exactly 604 pages and 15 lines each.
  - Every ayah (6236) appears exactly once, in order, with no gaps or overlaps.
  - Each ayah's lines fall within KFGQPC's stated range for it.
  - Surah header and basmala lines appear where expected.
  - The word sequence rebuilds the KFGQPC text verbatim.
- **Seam 3, end-to-end** (the `e2e` package, tester.army e2e, iOS first). Flows:
  - Open via Continue reading and land on the Last-Read Ayah's page.
  - A tap shows the controls, which auto-hide.
  - Swipe a page; the footer page number changes.
  - Switch to Surah Mode; the same ayah is highlighted.
  - Long-press an ayah, set it as last read, relaunch; it opens there.
  - Use the Next Surah button.
- **Prior art:** none in the new repo yet. These are the first domain and e2e tests. The old app's `scripts/verify-recite-matcher.ts` and `verify-mat-*.ts` are behavioural checks of pure logic in the same spirit as seam 1.

## Out of Scope

- Riwayat other than Hafs (Warsh, Qalun, Shu'bah, Duri, and others).
- Quran translations and tafsir. The notes button opens the ayah sheet only.
- Recite-Along for the Quran. It exists for Books only.
- Offline recitation downloads beyond the 7-day cache, and word-by-word audio.
- Bookmark collections beyond Favorites and the single Last-Read Ayah.
- Tajweed colouring.
- Admin or server changes. Nothing on the server reads the Quran.

## Further Notes

- The UX was validated in the throwaway prototype on branch `prototype/full-ux` (full-screen reader with tap-to-show controls, modelled on the reference screenshots the owner supplied). Don't port prototype code; rebuild it under the spec.
- Hizb in the prototype was estimated. The real build takes the hizb from data, or derives it from juz quarters in the KFGQPC metadata.
- Glossary terms used here: Quran Page, Surah, Page Mode, Surah Mode, Last-Read Ayah, Favorite, Believer, Guest.
- Before the reader ships, the Turso sync gate (ADR-0001) still needs its Turso Cloud and Android checks. The reader's persistence depends on it.
