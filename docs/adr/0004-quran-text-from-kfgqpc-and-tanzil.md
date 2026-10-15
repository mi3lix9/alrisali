---
status: accepted
---

# Quran text and font come from KFGQPC and Tanzil, bundled in the app

The app bundles the Quran: the KFGQPC Uthmanic Hafs font (shipped unmodified) and the Tanzil Uthmani text (shipped verbatim). Neither is loaded from Quran Foundation. The Quran Foundation Developer Terms (updated 2026-10-11) let apps bundle the QCF fonts but forbid bundling Quran text or translations at build time; text may only be cached for a week or kept offline through their Content Sync API with a re-sync every 7 days. That conflicts with a fully offline, fat-client app.

## Considered Options

- QCF v1 fonts (95 MB) plus the Content Sync API: page-exact mushaf, but depends on weekly network re-syncs.
- QCF v2 downloaded per page plus the Content Sync API: smallest app, but needs the network on the first view of each page.

## Consequences

- Quran Pages are reflowable, split at Tanzil's per-ayah page boundaries, until we have written permission to bundle a line-exact layout. That layout is QUL/Tarteel's "KFGQPC V2 layout", which has no license (TarteelAI/quranic-universal-library#729); KFGQPC may also need to agree.
- No Quran translations at launch.
- Recitation streams from the Quran Foundation audio API and is cached for at most 7 days. We don't use everyayah.com: its recordings have no license.
- Attribution: credit Tanzil with a link to tanzil.net, keep the Tanzil notice inside the bundled data file, ship the KFGQPC EULA, and add "Quran data provided by Quran.Foundation" for the audio.
