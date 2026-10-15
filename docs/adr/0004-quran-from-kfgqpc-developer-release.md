---
status: accepted
---

# The Quran comes from the KFGQPC developer release, bundled in the app

The app bundles KFGQPC's own developer release for Hafs (`kfgqpc_hafs_v30`, qurancomplex.gov.sa/quran-dev). From one official source it gets the Unicode text, the page and the first and last line of every ayah on the 604 fifteen-line Madinah pages, the matching Uthmanic Hafs font (shipped unmodified, under its free EULA), and a PDF of the whole mushaf. Nothing is loaded from Quran Foundation or QUL. The Quran Foundation terms (2026-10-11) forbid bundling their text, and QUL's layout data has no license. KFGQPC publishes these files for app developers, and the page and line numbers are facts about a public-domain text, so we judged that publication enough and did not ask for written permission.

## Considered Options

- Tanzil text with only Tanzil's page boundaries: the text is licensed, but there is no line layout, and the text was not made for the KFGQPC font.
- QUL/Tarteel line layouts: complete word-by-line data, but unlicensed (TarteelAI/quranic-universal-library#729).
- DigitalKhatt (OFL font, MIT engine): the best justification, but its line-break table may come from QUL.
- QCF glyph fonts plus the Quran Foundation Content Sync API: page-exact, but needs a weekly network re-sync.

## Consequences

- KFGQPC gives lines per ayah, not per word. Where an ayah spanning several lines breaks has to be worked out once, at build time, from the bundled PDF (or by fitting words to the font's widths), and then checked against the PDF.
- Use the non-"smart" Hafs build; KFGQPC says the smart build doesn't reproduce full pages.
- Hafs only. KFGQPC also publishes Warsh, Qalun, Shu'bah and Duri in the same format, so adding them later is a data change only.
- No Quran translations at launch. Recitation streams from Quran Foundation and is cached for at most 7 days (everyayah.com recordings have no license), credited as "Quran data provided by Quran.Foundation".
