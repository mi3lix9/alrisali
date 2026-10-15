# 01: App shell: Panel UI, native tabs, Arabic RTL

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Replace the scaffold's demo screens with the real app shell: expo-router native tabs (Home, Prayer, Library, Worship, Tasbih) with native stack/modals, Panel UI screens on Uniwind/Tailwind v4, Arabic RTL by default via expo-localization `forcesRTL` with an English switch, light/dark themes, typed i18n catalogues (ar/en). Every tab opens an empty, correctly-titled screen.

**Blocked by:** 00 (Feature folder structure and enforced boundaries)

**Status:** ready-for-agent

- [x] Demo/heroui-native screens and dependencies removed; Panel UI provider in place
- [ ] Five native tabs render with Arabic labels and mirrored layout; English switch flips to LTR after relaunch (code complete; pending simulator verification)
- [ ] Light/dark follow the system and a manual override (code complete; pending simulator verification)
- [x] Typed i18n keys: a missing key fails type-check
- [x] `check` and `build` pass
