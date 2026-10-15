# 22: Quran data build and basic Page Mode

**Parent:** docs/issues/0000-alrisali-rebuild.md (Quran detail: 0001-quran-reader.md)

**What to build:** Import KFGQPC Hafs v30 (text, page/line spans, font, PDF), derive line breaks inside multi-line ayat from the PDF, bundle the dataset with the KFGQPC notice, and render any of the 604 Quran Pages in a basic Page Mode screen from the Library.

**Blocked by:** 01 (App shell: Panel UI, native tabs, Arabic RTL)

**Status:** ready-for-agent

- [ ] Integrity tests (seam 4): 604 pages × 15 lines, 6236 ayat exactly once in order, lines within KFGQPC spans, verbatim text
- [ ] Any page 1–604 renders offline with the KFGQPC font
- [ ] Notice included
