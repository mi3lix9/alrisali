# Page-exact Mushaf layout options (beyond QUL) — 2026-10-15

Constraints: free, MIT code, bundled, offline, Arabic RTL, Expo/React Native.

## 1. KFGQPC official developer platform — BEST FIND

- [SRC] https://qurancomplex.gov.sa/quran-dev/ publishes zips for Hafs (`kfgqpc_hafs_v30.zip`, update 15.0, modified 30-09-2026), Hafs-smart, Warsh, Shu'bah, Qalun, Duri (+Susi/Bazzi/Qunbul per mirror https://github.com/ibnhazm/KFGQPC).
- [SRC] DB fields per ayah: `id, jozz, page, sura_no, sura_name_en, sura_name_ar, line_start, line_end, aya_no, aya_text_unicode, aya_text_emlaey` (same for Warsh/Shubah/Qalun/Duri; Duri `page` may be "a–b").
- [SRC] Downloaded and checked Hafs v30 JSON: 6236 ayat, pages 1..604, lines 1..15 (e.g. 1:7 → page 1, lines 6–8). Zip also has a .docx and a .pdf of the full Mushaf typeset in the font, plus the TTF.
- Hafs-smart is explicitly "not intended to display the entire page identical to the Madinah mushaf" [SRC same page]; use `kfgqpc_hafs_v30` (non-smart) for page mode.
- License [SRC, TTF name table]: "Permission is hereby granted, Free of Cost … to Use, Copy, Distribute"; "cannot be Sold, Modified, Altered …". So bundling the unmodified TTF in a free app is OK. The data files ship with NO license text [SRC: zip listing has no license file]; the text is the Quran (no copyright in the ayat) and page/line numbers are facts [INFERENCE]. Risk: low; KFGQPC publishes it explicitly "for developing applications".
- Gap: gives the ayah's start/end line, NOT where an ayah that spans lines breaks mid-ayah, nor which words share a line. Breaks inside ayat must be derived (see §6). Text is the KFGQPC encoding, not Tanzil verbatim — use KFGQPC text with the KFGQPC font (they are designed together) [INFERENCE].
- Print edition: matches the font's own typeset PDF (15-line, 604 pages, Madinah layout) [SRC counts]; exact 1405/1421/1441 print not stated [UNVERIFIED].

## 2. DigitalKhatt

- [SRC] `DigitalKhatt/madinafont` — SIL OFL 1.1 (variable OpenType Madina font). `DigitalKhatt/oldmadinafont` (old Madina 1995), `DigitalKhatt/indopakfont` (13-line IndoPak, OFL-1.1). `DigitalKhatt/digitalkhatt-js` — MIT, includes core libs + **React Native adapter** + digitalkhatt.org source.
- Justification engine stretches glyphs (kashida/variable widths) to fill lines; line breaks come from layout data that "is exact copy of KFGQPC V2 (1421H) layout" [SRC https://qul.tarteel.ai/resources/mushaf-layout/21].
- Bundleable: font (OFL) + code (MIT) yes. Whether the per-line break table inside digitalkhatt-js carries the MIT grant or is QUL-derived (unlicensed, #729) [UNVERIFIED — inspect repo data files before shipping].
- RN: needs HarfBuzz (WASM/native) for variable-font justification [INFERENCE]; heavier but true text rendering.

## 3. Open GitHub datasets

| Repo | License | Content | Bundle? |
| --- | --- | --- | --- |
| MohamadHajjRabee/quran-qcf4 | JSON MIT; QCF4 fonts "not covered… redistribution… not permitted" [SRC LICENSE.md] | 604 pages, line/word JSON, QCF V4 1441H | JSON MIT, but almost certainly derived from quran.com/QUL word-glyph data → conflicts with QF Developer Terms [INFERENCE] |
| zonetecde/mushaf-layout | none (GitHub license API 404) [SRC] | 604 page JSON lines/words + QPC glyphs | No (no license) |
| blueheron786/quranic-universal-library-mushaf-layouts | QUL data, SQLite | QUL 15-line | Same status as QUL (no license) |
| quran/quran.com-images | GitHub reports MIT; README says code "copyleft GPL" and "fonts and pages … belong to KFGQPC" [SRC] | Perl generator + glyph bounds DB (old madani QCF V1) | Code OK; output pages = KFGQPC property |
| quran/quran_android | GPL-3.0 [SRC] | app; downloads page images + ayahinfo DBs from server | GPL incompatible with MIT bundling; images not in repo |
| QuranHub/quran-pages-images | GPL-3.0 badge [SRC README] | Hafs/Warsh/Tajweed page images + ayah bounds | GPL-3 → can't bundle in MIT app w/o relicensing app |
| The-Quran-Project/Quran-Mushaf | Unlicense [SRC GitHub API] | page images from a PDF (release assets) | Repo license can't cover KFGQPC-printed pages; provenance [UNVERIFIED] |
| risan/quran-json, semarketir/quranjson, alquran.cloud | page/juz per ayah only, no line data [UNVERIFIED for this report] | — | no page-exact lines |

## 4. Image-based mushaf

- Pages are KFGQPC-printed artwork ("pages belong to KFGQPC" — quran.com-images README [SRC]). No KFGQPC grant found permitting image redistribution [UNVERIFIED]. Size: 604 PNG pages ≈ 50–150 MB at phone widths [INFERENCE]. Fallback only.

## 5. IndoPak

- DigitalKhatt indopakfont (13-line, OFL) [SRC]; QUL/fonts.quran.ws list KFGQPC Nastaleeq 15/16-line layouts [SRC listing] but those layouts are QUL data (no license).

## 6. Generate our own layout (Tanzil/KFGQPC text + KFGQPC Hafs font)

- Inputs available legally: per-ayah page + line_start/line_end (official KFGQPC, §1); typeset PDF in the same zip.
- Missing: intra-ayah line breaks. Options: (a) extract word positions from the official PDF's text layer (pdftotext -bbox) to get exact per-line word ranges [INFERENCE: feasible if PDF has a text layer]; (b) greedy-fit words into the known line span using font advance widths, then verify against PDF.
- Legal reasoning [INFERENCE]: which word starts line N on page P is a fact about a public-domain text's arrangement in a 1405H+ print; facts aren't copyrightable (US Feist), though EU sui-generis database right could cover a substantial extraction of a _database_ (QUL's). Deriving from KFGQPC's own published file + PDF avoids reliance on QUL/QF datasets. Not legal advice.
- Rendering: RN `<Text>` per line, `textAlign:'justify'` is weak for Arabic; better measure line width and scale/letterSpace per line, or render each line as SVG text [INFERENCE].

## Ranking

1. KFGQPC official Hafs v30 data + KFGQPC Hafs TTF + self-derived intra-ayah breaks (from official PDF) — legal, text-based, 15 lines/604 pages; also covers Warsh/Qalun/Shu'bah/Duri.
2. DigitalKhatt madinafont (OFL) + digitalkhatt-js (MIT, RN adapter) — best typography; verify layout-table provenance first.
3. KFGQPC data alone (ayah-level line spans, ragged breaks) — ship-now fallback.
4. quran-qcf4 JSON (MIT) — license nominal; upstream QF/QUL taint, fonts not redistributable.
5. GPL image sets (QuranHub, quran_android) — only if app goes GPL; KFGQPC artwork rights unresolved.
6. zonetecde / QUL mirrors — no license; avoid.
