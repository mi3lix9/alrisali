# Quran assets for an offline Expo app — licensing findings (checked 2026-10-15)

Tags: [SRC] = read at the cited URL · [INFERENCE] = my reasoning · [UNVERIFIED] = not confirmed from a primary source

## 1. Page-exact Madani layout (604 pages, 15 lines, Hafs) for the KFGQPC Uthmanic Hafs Unicode font

- [SRC] QUL (https://qul.tarteel.ai/resources/mushaf-layout) lists these layouts: "KFGQPC V1 layout (1405H print)" (/15), "KFGQPC V2 layout (1421H print)" (/10), "KFGQPC V4 layout (1441H print)" (/19) and "Digital Khatt (KFGQPC V2 1421H print)" (/21). Each comes as sqlite or docx.
- [SRC] Schema (https://qul.tarteel.ai/resources/mushaf-layout/10): the `pages` table has page_number, line_number, line_type (ayah|surah_name|basmallah), is_centered, first_word_id, last_word_id, surah_number. A separate "Quran script" db has a `words` table (word_index, word_key, surah, ayah, text). QUL's own sample renders it with the `qpc-hafs` class, "Use QPC Hafs font". **So line-level data exists and works with the Unicode KFGQPC Hafs font.** Pair it with QUL's "QPC Hafs" word-by-word script, not the QCF V1/V2 glyph scripts.
  - [INFERENCE] The layout matches the KFGQPC Hafs Unicode font for the 1421H (V2) print. Line justification is your own job: QUL only gives `is_centered`.
- **License: none stated.** [SRC] QUL FAQ: "Some data may have restrictions or require attribution… We recommend reviewing the licensing information provided by each resource's author before use." [SRC] GitHub issue TarteelAI/quranic-universal-library#729 (still open, last updated 2026-10-06) says no licence or terms text exists for "KFGQPC V2 layout (1421H print)" or "QPC V2 Font". **No answer from QUL yet.** [INFERENCE] Treat it as not cleared for commercial bundling. Get written permission from Tarteel/QUL and, for the layout of the print, from KFGQPC.
- [SRC] Tanzil metadata (https://tanzil.net/docs/quran_metadata) gives quran-data.xml (77,234 bytes, measured with a HEAD request). It holds sura info plus juz, hizb quarters, manzil, ruku, **page** (Medina Mushaf) and sajda boundaries per ayah. It is ayah-level only: no line or word layout. It is distributed alongside the Tanzil text (CC BY 3.0, §3). [UNVERIFIED] whether a separate license applies to the metadata file.
- [UNVERIFIED] File sizes of the QUL sqlite files: the downloads are behind JS or login, so I did not measure them. [INFERENCE] Expect a layout db of roughly a few hundred KB and a word db of roughly 2–5 MB.
- [UNVERIFIED] Not checked: quran.com-images and the Tarteel "mushaf-layout" GitHub repos. Quran Foundation's terms (§4) allow bundling _Mushaf images and fonts_ but not text or layout datasets.

## 2. KFGQPC Uthmanic Hafs font license

- [SRC] KFGQPC EULA as embedded in KFGQPC fonts (text copied from the Alphabet Dotted font's metadata, https://www.arfonts.net/kfgqpc-alphabet-dotted-info). Search snippets show the same "ELECTRONIC END-USER LICENSE AGREEMENT" header in the KFGQPC HAFS Uthmanic Script font:
  > "Permission is hereby granted, Free of Cost, to any person obtaining a copy of this Font accompanying this license, the rights to Use, Copy, Distribute, subject to the following conditions: 1. The Font Software cannot be Sold, Modified, Altered, Translated, Reverse Engineered, Decompiled, Disassembled, Reproduced or Attempted to discover the Source Code of this Font in no means. 2. The Font Software is provided "AS IS"…"
- [SRC] The copyright field of that same font file says it "may not be reproduced, modified without the express written approval of King Fahd Glorious Quran Printing Complex". This contradicts the EULA's "Copy, Distribute".
- [INFERENCE] Bundling the unmodified TTF in an app (paid or free) is the common reading of "Use, Copy, Distribute" as long as the font is not sold on its own. Do NOT subset, convert (e.g. to WOFF2) or modify it. Expo bundling of the TTF as-is is fine. Ship the EULA text. [UNVERIFIED] Read the exact EULA inside the Hafs TTF you ship (name table ID 13). Official licence page: http://dm.qurancomplex.gov.sa/copyright-2/ (linked from nuqayah/qpc-fonts; not fetched).

## 3. Tanzil Uthmani text license — [SRC] https://tanzil.net/docs/text_license

```
Tanzil Quran Text
Copyright (C) 2007-2021 Tanzil Project
License: Creative Commons Attribution 3.0
...
- Permission is granted to copy and distribute verbatim copies
  of this text, but CHANGING IT IS NOT ALLOWED.
- This Quran text can be used in any website or application,
  provided that its source (Tanzil Project) is clearly indicated,
  and a link is made to tanzil.net to enable users to keep
  track of changes.
- This copyright notice shall be included in all verbatim copies
  of the text, and shall be reproduced appropriately in all files
  derived from or containing substantial portion of this text.
```

Commercial use is OK. Requirements:

- keep the text verbatim; no edits to letters or diacritics. [INFERENCE] Splitting it into words or storing it in sqlite is fine if the characters are untouched.
- in-app credit "Tanzil Project" with a link to tanzil.net
- keep the notice inside the bundled data file

## 4. Recitation audio

- **everyayah.com:** [SRC] the only terms found are in the timing-file disclaimers (e.g. https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/000_disclaimer.txt): "(C) VerseByVerseQuran.com You must link back to our site from your product and web-site to use these timings." The linked full licence (versebyversequran.com/site/license) returns 404. The Alafasy disclaimer URL also returns 404. **The MP3s have no published license and no reciter grant.** [INFERENCE] Streaming or caching them is widespread but legally unclear. Mishary Alafasy's recordings are his own copyright; get written permission for a paid app. [UNVERIFIED] No Alafasy redistribution policy was found.
- **Quran Foundation API/CDN:** [SRC] https://api-docs.quran.foundation/legal/developer-terms/ (updated 2026-10-11):
  - Paid apps, subscriptions, IAP and ads are allowed "provided that QF Content and raw API data are not sold, sublicensed, or redistributed".
  - Developers must not "Cache or store QF Content longer than **1 week** unless it is obtained and maintained through the Content Sync APIs… or consists of font files or Mushaf images". With Content Sync, you must re-sync at least every 7 days when connectivity permits.
  - "The Content Sync storage exception does not itself authorize distributing a prepackaged database or build-time bundle of QF Content."
  - Fonts and Mushaf images may be bundled if you keep an active Developer Console account and credit Quran Foundation.
  - [INFERENCE] Audio (QF Content) can be streamed. Caching beyond 7 days is only allowed if audio is a Content Sync resource ([UNVERIFIED]; check the Content Sync list). Bundling audio is not allowed. Bundling text or layout from QF requires a commercial licence.
- **mp3quran.net:** [SRC] public API index at https://www.mp3quran.net/api/ (reciters_json.php, verse/, etc.). [UNVERIFIED] No license or terms text found.

## Recommended bundle

1. Text: Tanzil Uthmani (CC BY 3.0 notice, verbatim).
2. Page and juz metadata: Tanzil quran-data.xml.
3. Font: KFGQPC Hafs TTF, unmodified, with its EULA.
4. Line layout: QUL V2 layout and QPC Hafs words, only after written OK (issue #729).
5. Audio: stream only. Get written permission before any offline caching.
