# Tanzil Quran Metadata — hizb quarters

Source: Tanzil Quran Metadata ver 1.0, Copyright (C) 2008-2009 Tanzil.info, https://tanzil.net/res/text/metadata/quran-data.js (documentation: https://tanzil.net/docs/quran_metadata). Licence: Creative Commons Attribution 3.0 (CC BY 3.0), https://creativecommons.org/licenses/by/3.0/.

## What is used

- The `HizbQaurter` table: the first ayah of each of the 240 hizb quarters, which the reader uses for the hizb shown on each Quran Page.

- The `Sura` table's place of revelation (Meccan or Medinan) and revelation order for each of the 114 surahs, which the Quran index shows and sorts by. Built by `packages/content/scripts/quran/build-revelation.ts` into `src/quran/data/revelation.ts`, unchanged.

## Changes

- Corrected to the KFGQPC Hafs v30 text, whose ۞ signs mark the Madinah mushaf's quarters: the quarter Tanzil starts at 15:50 starts at 15:49. Every other start matches a ۞ sign or opens a surah, where the mushaf prints no sign. Built by `packages/content/scripts/quran/build-hizb.ts` into `src/quran/data/hizb.ts`.
