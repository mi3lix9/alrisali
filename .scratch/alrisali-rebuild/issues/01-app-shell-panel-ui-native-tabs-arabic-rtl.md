# 01: App shell: Panel UI, native tabs, Arabic RTL

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Replace the scaffold's demo screens with the real app shell: expo-router native tabs (Home, Prayer, Library, Worship, Tasbih) with native stack/modals, Panel UI screens on Uniwind/Tailwind v4, Arabic RTL by default via expo-localization `forcesRTL` with an English switch, light/dark themes, typed i18n catalogues (ar/en). Every tab opens an empty, correctly-titled screen.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Demo/heroui-native screens and dependencies removed; Panel UI provider in place
- [ ] Five native tabs render with Arabic labels and mirrored layout; English switch flips to LTR after relaunch
- [ ] Light/dark follow the system and a manual override
- [ ] Typed i18n keys: a missing key fails type-check
- [ ] `check` and `build` pass
