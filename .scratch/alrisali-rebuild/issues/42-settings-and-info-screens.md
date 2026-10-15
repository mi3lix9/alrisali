# 42: Settings and info screens

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Tab customisation (Home always), font size, theme, language, Sources & Credits, Privacy and Terms.

**Blocked by:** 01 (App shell: Panel UI, native tabs, Arabic RTL)

**Status:** done — pending simulator verification

- [ ] Tab changes apply immediately (code complete: Settings → Tabs switches update the native tab bar through the preferences store, Home's switch is locked on; domain rules tested in `packages/domain/src/shared/tabs.test.ts`; pending simulator verification)
- [x] Sources & Credits lists every bundled source (renders every `CONTENT_SOURCES` entry from `@alrisali/content` — KFGQPC, Thaqalayn, alquran.cloud, EveryAyah.com — plus Panel UI and Expo/React Native; a source without a credit line fails type-check)
