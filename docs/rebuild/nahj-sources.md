# Nahj al-Balagha (and al-islam.org) — redistributable sources for an offline app

Researched 2026-10-15. Tags: [SRC] = I read the cited page; [INFERENCE] = my reasoning; [UNVERIFIED] = not confirmed.

## Ranked recommendations

### 1. Thaqalayn (thaqalayn.com / thaqalayn.net, book 32) — RECOMMENDED

- [SRC] https://thaqalayn.com/terms ("Last Updated: October 1, 2026"), §02:
  > "Stichting Thaqalayn licenses its public library content, including translations, under Creative Commons Attribution 4.0 International (CC BY 4.0). You may copy, share, and adapt this material, including commercially, under the licence terms." "Credit Thaqalayn (Stichting Thaqalayn), preserve supplied author, translator, and other attribution notices, link to the source and licence where reasonably practicable, and indicate any changes. Do not imply endorsement by Thaqalayn. For example: “Source: Thaqalayn — [source link]. Translation: [translator, where recorded]. CC BY 4.0 — [licence link]. Changes: [describe any modifications].”" "This grant covers the rights held by Stichting Thaqalayn. … Private user data, software, logos, and trademarks are outside this grant."
- [SRC] https://thaqalayn.com/book/32: Nahj al-Balāgha in Arabic and English, "Translated by Sayed Ali Raza"; organised by section (sermons, letters, sayings). The sayings appear as chapters 1, 2, 3… under section 3 (`/chapter/32/3/N`).
- Machine-readable access: [SRC] https://github.com/MohammedArab1/ThaqalaynAPI is an unofficial scraper and API (`https://www.thaqalayn-api.net/api/v2/[bookId]`) that returns all hadiths of a book as JSON. Its README says: "Feel free to use any part of this project and modify as you'd like." It also says the bundled `V2/ThaqalaynData` JSON is "outdated and no longer maintained". Fetch the data once at build time, then ship it in the app.
- Caveats:
  - [INFERENCE] The CC BY grant only covers "rights held by Stichting Thaqalayn". The Sayed Ali Raza translation was published in print (the archive.org scan bears the name "Sayyid Ali Reza"; TTQ/Ansariyan editions exist). Whether Thaqalayn holds or licensed those rights is **[UNVERIFIED]**. Before a paid release, email info@thaqalayn.net and ask them to confirm in writing that the Nahj translation is covered.
  - [UNVERIFIED] It is not confirmed whether Thaqalayn's numbering follows Subhi al-Salih's. Sample-check sermon 3 (Shiqshiqiyya) and saying 1 against a printed Subhi al-Salih edition.

### 2. Arabic text only — public domain, but edition/typing rights vary

- [INFERENCE] The underlying text (compiled by al-Sharif al-Radi, d. 406/1015) is public domain everywhere. Copyright can attach only to modern editorial work: a critical apparatus, Muhammad ʿAbduh's or Subhi al-Salih's notes and headings, and arguably the typed digital file under database rights (EU).
- If you take only the bare Arabic matn and its section numbers from Thaqalayn (CC BY), you avoid that risk entirely. Numbers themselves are facts and not copyrightable [INFERENCE].
- Subhi al-Salih's edition (1967) is still in copyright as an edition. Use his numbering scheme, not his footnotes or headings [INFERENCE].

### 3. OpenITI corpus — fallback for Arabic only, likely NOT usable in a paid app

- [SRC] The DLME catalogue lists an OpenITI text `1323MuhammadCabduh.NahjBalagha.Rafed0001617Vols-ara1` (the ʿAbduh recension, sourced from Rafed): https://dlmenetwork.org/library/catalog/1323MuhammadCabduh.NahjBalagha.Rafed0001617Vols-ara1
- [SRC] The OpenITI RELEASE README states no licence. The _software_ repo OpenITI/openiti is MIT ("Copyright (c) 2020 Kitab Project"), but that licence does not cover the texts.
- [UNVERIFIED] The corpus data is commonly cited as CC BY-NC-SA 4.0 on Zenodo; the Zenodo page returned 403 when I tried to read it. If it is NC, it rules out a paid app. Its source text was scraped from Rafed, so provenance is weak anyway.

### 4. Rewayaat / Academy of Islam hadith DB (rewayaat.info, 2,260 Nahj items) — NOT a licence source

- [SRC] https://rewayaat.info/ disclaimer: "This database collects Shi`i Islamic hadith from available translations, online and in print … The contents and translations remain the responsibility of their original sources." No open licence is stated. Do not bundle it.

### 5. al-islam.org (DILP) — NOT redistributable without permission

- [SRC] Banner shown on every page (e.g. http://al-islam.org/, https://al-islam.org/library/imam-ali): "Important: All content hosted on Al-Islam.org is solely for non-commercial purposes and with the permission of original copyright holders. Any other use of the…" (the text is cut off in the fetch). So DILP does not own most of the texts; it hosts them by permission, for non-commercial use.
- [INFERENCE] This affects the already-scraped **Sahifa Sajjadiyya** (al-islam.org hosts William Chittick's translation, © Muhammadi Trust / Ansariyan) and **Mafatih al-Jinan** (translation by Badr Shahin, © Ansariyan). Do not ship those English translations — not in a paid app, and not in a free app without written permission. The Arabic duʿa texts are public domain. Re-source the Arabic, and preferably the English too, from Thaqalayn: it also carries duas under the same CC BY 4.0 [SRC terms: "Read Shia hadith, the Quran and duas"]. Check per-book translator credits there.

### 6. Others

- Askari Jafery translation: [SRC] catalogued at U. Iowa (https://search.lib.uiowa.edu/primo-explore/fulldisplay/01IOWA_ALMA21351517640002771/01IOWA). It is a 20th-century work, so [INFERENCE] still in copyright. No open licence found.
- Yasin al-Jibouri's translation: published by TTQ / Iraqi Ministry of Culture (haydarya PDF). Copyrighted.
- lib.eshia.ir, ghbook.ir, shiaonlinelibrary: [UNVERIFIED] no open licences found in this pass. Treat as all-rights-reserved.
- Arabic Wikisource: [UNVERIFIED] I could not confirm a complete Nahj text there. Wikisource text would be CC BY-SA, plus PD for the matn.
- GitHub `thaaerali/nahj-al-balagha-json`: appeared in search results but returns 404, and no licence is known. Avoid.

## Attribution string to ship (in-app About/Credits)

"Nahj al-Balāgha — Arabic text and English translation (Sayed Ali Raza) sourced from Thaqalayn (Stichting Thaqalayn), https://thaqalayn.com/book/32, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: reformatted to JSON for offline use. Not endorsed by Thaqalayn."

## Action items

1. Pull book 32 via thaqalayn-api v2/v3 at build time and store it as JSON in the bundle.
2. Email info@thaqalayn.net to confirm the Ali Raza translation is covered by CC BY.
3. Replace the al-islam.org-sourced Sahifa and Mafatih English translations, or get written permission.
4. Validate numbering against Subhi al-Salih (sermons 241, letters 79, sayings 480).
