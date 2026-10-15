# 08: Hijri calendar with Occasions

**Parent:** docs/issues/0000-alrisali-rebuild.md

**What to build:** Hijri Date (Umm al-Qura with fallback) everywhere it matters, a Hijri month grid with Gregorian dates, the ~55 bundled Shia Occasions by type, and the Believer's personal Hijri Adjustment (±2).

**Blocked by:** 02 (Device database spine: per-user DB, migrations, settings)

**Status:** done — pending simulator verification (screens checked by type-check and JS bundle only); the Admins' Hijri Adjustment joins with the content replica (ticket 13)

- [x] Domain tests: conversion, adjustment, month grid, Occasion resolution, Hijri window across year boundary — `packages/domain/src/shared/{hijri,occasions}.test.ts`; Umm al-Qura via Intl, arithmetic fallback when Intl ignores the calendar (probed), plus `believer_settings.hijri_adjustment` repository tests
- [ ] Calendar screen shows grid and Occasions colour-coded by type — built: `/calendar` (own Hijri grid with Gregorian days, a dot per Occasion type, chosen day's and month's Occasions with type badges); Home shows today's Hijri Date and Occasions; type-checks and the iOS JS bundle exports. pending simulator verification
- [ ] Personal Hijri Adjustment changes every displayed Hijri Date — built: Settings → Hijri Adjustment (−2…+2) saves to the per-user DB; every Hijri Date comes from `useHijriCalendar()` (`shared/lib/hijri-calendar.ts`), keyed on the effective adjustment; the shift itself is covered by domain tests. pending simulator verification
