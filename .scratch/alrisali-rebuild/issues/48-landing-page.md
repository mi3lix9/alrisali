# 48: Landing page

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Public landing page in Arabic and English with store links, Privacy, Terms and Contact pages on the web app.

**Blocked by:** 00 (Feature folder structure and enforced boundaries)

**Status:** done

- [x] Both languages with correct direction (Arabic at `/`, `/privacy`, `/terms`, `/contact` with `lang="ar" dir="rtl"`; English under `/en` with `lang="en" dir="ltr"`; verified on SSR output)
- [x] Links to stores and Contact form (store URLs from `VITE_APP_STORE_URL` / `VITE_PLAY_STORE_URL`; the Contact page route is linked from the header, footer and landing — the form itself arrives in ticket 20)
  - Live App Store listing pending env: VITE_APP_STORE_URL (schema default is a placeholder id until the listing exists)
