# 22: Quran data build and basic Page Mode

**Parent:** docs/issues/0000-alrisali-rebuild.md (Quran detail: 0001-quran-reader.md)

**What to build:** Import KFGQPC Hafs v30 (text, page/line spans, font, PDF), derive line breaks inside multi-line ayat from the PDF, bundle the dataset with the KFGQPC notice, and render any of the 604 Quran Pages in a basic Page Mode screen from the Library.

**Blocked by:** 01 (App shell: Panel UI, native tabs, Arabic RTL)

**Status:** done — pending simulator verification of the page drawing

- [x] Integrity tests (seam 4): 604 pages × 15 lines, 6236 ayat exactly once in order, lines within KFGQPC spans, verbatim text — `packages/content/src/quran/quran.test.ts`. Pages 1 and 2 have 8 lines (header, then the centred opening as KFGQPC numbers them); the test pins exactly those two as the only short pages. Line breaks come from the PDF text layer (`scripts/quran/build.ts`), and the build stops unless they match the release's Word source line for line (they do on all 604 pages).
- [ ] Any page 1–604 renders offline with the KFGQPC font — Library › "Open the mushaf" opens `/quran` (horizontal RTL pager over all 604 pages, KFGQPC font bundled unmodified through Metro, dataset bundled in JS; iOS JS export verified, font asset bytes identical to KFGQPC's). Pending simulator verification of the drawn pages.
- [x] Notice included — `packages/content/notices/kfgqpc.md` (font copyright and EULA quoted from the TTF) and `KFGQPC_NOTICE` inside the bundled dataset; KFGQPC is listed in `CONTENT_SOURCES` for Sources & Credits.
