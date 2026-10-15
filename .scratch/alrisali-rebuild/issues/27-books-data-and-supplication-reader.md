# 27: Books data and Supplication reader

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Build-time fetch of Mafatih, Sahifa and Nahj al-Balagha from Thaqalayn into bundled data with stable Supplication ids; browse screens and a Supplication reader with font size and Arabic/English/both.

**Blocked by:** 01 (App shell: Panel UI, native tabs, Arabic RTL)

**Status:** done — pending simulator verification

- [x] Integrity tests: unique stable ids, notice present (`packages/content/src/books/books.test.ts`: unique well-formed ids, every id in `published-ids.json` still resolves, Arabic text for all 872 Supplications, Sahifa 54+7, Nahj 241/79/480, Thaqalayn credited with a CC BY 4.0 notice in `packages/content/notices/thaqalayn.md`)
- [ ] All three Books browsable offline (code complete: Library → Books card → Book contents → reader; all text bundled in `@alrisali/content/books`, loaded per Supplication; iOS JS bundle exports cleanly; pending simulator verification)
- [ ] Reader font and language toggles work (code complete: Arabic/English/both toggle and font −/+ (16–40) persisted on device; pending simulator verification)

Notes: Thaqalayn has no Mafatih al-Jinan book; the Mafatih Book holds the 6 duas and 5 ziyarat Thaqalayn publishes (no other source used, nothing from al-islam.org). ThaqalaynAPI was returning 500, so Nahj came from that project's published dataset (the build script tries the API first). Rebuild with `bun run books:build -F @alrisali/content`.
