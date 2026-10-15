# Spike 2 — Panel UI under forced RTL

**Status: SPIKE CANCELLED BY USER.** This report covers only what was observed before the cancellation. Android was **not verified (skipped by user decision; disk constraints)**.

**Verdict: PARTIAL.** On iOS, Panel UI mirrors almost everything correctly under RTL. There are three real defects (the Tabs indicator, the Hijri Calendar grid and the TextInput placeholder) and two platform/shell problems (native tabs order and the `@expo/ui` BottomSheet content). Each one has a workaround.

## Versions (from node_modules)

| Package | Version |
| --- | --- |
| expo | 58.0.10 (`next` tag; `latest` was still 57.0.29) |
| create-expo-app template | `default@sdk-58` (58.0.19) |
| react-native | 0.88.0-rc.4 |
| expo-router | 58.0.19 (`expo-router/native-tabs`) |
| @expo/ui | 58.0.17 |
| panelui-native | 0.111.0 |
| uniwind / tailwindcss | 1.12.2 / 4.3.3 |
| react-native-reanimated / gesture-handler / svg | 4.7.1 / 3.3.0 / 15.15.5 |
| expo-localization | 58.0.4 |

## Setup

- The app was scaffolded with `bunx create-expo-app panelui-rtl --template default@sdk-58`. Panel UI was added as described on panelui.dev/docs/installation: the `uniwind/metro` wrapper, `src/global.css` with the three `@import`s and the `@source`, and `PanelUIProvider` in `src/app/_layout.tsx`.
- Bundle ID: `com.alrisali.app.dev.spike2`. `expo-localization` plugin is `{ supportsRTL: true }`, plus `extra.supportsRTL: true`. The layout calls `I18nManager.allowRTL(true)`.
- Screens: `src/app/index.tsx` (Card, Item rows, Input, Select, Switch, Slider, Tabs, Progress), `src/app/calendar.tsx` (Calendar in Gregorian and Islamic, DatePicker, BarChart, LineChart) and `src/app/overlays.tsx` (Dialog, Panel BottomSheet, Panel BottomSheet `native`, `@expo/ui` BottomSheet, Toast). Each screen has a probe line showing `isRTL=… panel=<useDirection()> loc=…`.
- Build: `npx expo prebuild --clean`, then `CI=1 bunx expo run:ios --configuration Release --device <alrisali-spike2>`. That is a Release build with the bundle embedded and no Metro. Later JS changes were re-bundled with `expo export:embed` into the built `.app`, ad-hoc re-signed and reinstalled with `xcrun simctl install`.
- Simulator: a new device, **alrisali-spike2** (iPhone 18 Pro, iOS 27.0 runtime). The device locale was en-SA (`loc=en-SA/ltr`), so RTL came only from the app.
- Screenshots were taken with `xcrun simctl launch … -spikeRoute "<route>"`, which is read through `Settings.get` in `_layout.tsx`, followed by `xcrun simctl io … screenshot`. Taps were done with AXe 1.8.0. The binary had to be re-signed ad hoc locally before it would run; deep-link `simctl openurl` brings up an "Open in…" alert that AXe could not dismiss.

## Key finding: how RTL can be forced with expo-localization installed

- **Runtime `I18nManager.forceRTL(true)` does not survive a relaunch.** `expo-localization`'s iOS module (`LocalizationModule.swift`, `OnCreate → setRTLPreferences`) calls `RCTI18nUtil.forceRTL(ExpoLocalization_forcesRTL ?? false)` on every launch, which overwrites the persisted flag. Observed: right after the JS call, the app prefs plist had `RCTI18nUtil_forceRTL => true`. After a relaunch it was `false` and the screen showed `isRTL=false`.
- **The supported way works:** `ExpoLocalization_forcesRTL = true` in Info.plist. That is what `["expo-localization", { "forcesRTL": true }]` writes. With it, the next launch showed `isRTL=true panel=rtl`. For the RTL screenshots, the key was added to the built `.app` with `plutil`. The app.json in this spike still has only `supportsRTL: true`.
- **Recommendation for Alrisali (Arabic-first):** use `["expo-localization", { "supportsRTL": true, "forcesRTL": true }]` and do not call `I18nManager.forceRTL` from JS. Panel's `useDirection()` follows the device/I18nManager value.

## Per-component results (iOS, alrisali-spike2)

| Component | LTR | RTL | Notes |
| --- | --- | --- | --- |
| Card | OK | OK | Text aligns to the start edge. |
| Item rows (leading icon + trailing `ChevronRightIcon`) | OK | OK | The row mirrors, the icon goes to the right and the chevron flips to `<` (Panel icons with `flip: true`). |
| Input with label (startContent icon) | OK | **Broken (minor)** | The label and icon mirror, but the **placeholder stays at the physical left** when empty. Typed values align correctly. This comes from RN TextInput's natural alignment, not from Panel. **Workaround verified:** `textAlign={I18nManager.isRTL ? 'right' : 'left'}` (screenshot `ios-rtl-forms-3.png`). |
| Select (Panel, overlay) | OK (closed) | OK | Closed and open both mirror: the chevron is at the left and the checkmark at the end (`ios-rtl-select-open.png`). LTR open state was not captured. |
| Select `native` (SwiftUI menu) | OK | OK (closed) | The inline Host gets `layoutDirection` from I18nManager. The open menu was not captured. |
| Switch (Panel) | OK | OK | The track mirrors: on = thumb at the left in RTL. |
| Switch `native` | OK | OK | Mirrored the same way, label on the start side. |
| Slider (Panel) | OK | OK | Fills from the right and the thumb sits at 30% from the right. Dragging was not tested. |
| Slider `native` | OK | OK | Fills from the right, at 70%. Dragging was not tested. |
| Tabs (segmented) | OK | **Broken** | The trigger order mirrors (الفجر on the right), but the **selected indicator disappears**. The indicator uses `absolute left-0` plus `translateX(layout.x)`. Under RTL, `left` is swapped to `right`, so the chip is pushed off-screen. **Proposed fix (written, NOT verified):** `patches/panelui-native-tabs-rtl.patch` wraps the indicator in an absolute `direction: 'ltr'` frame. Before the patch can be trusted it needs one more build and a screenshot. Until then, use `variant` without an indicator, or patch the package. |
| Progress | OK | OK | Fills from the right. |
| Calendar (Gregorian, `locale="ar"`, `weekStartsOn={6}`) | OK | OK | Saturday is the first column and appears on the right in RTL. The grid mirrors and the prev/next chevrons mirror. |
| Calendar `calendar="islamic"`, `locale="ar-SA"` | **Broken** | **Broken** | The caption shows the Hijri month (ربيع الآخر ١٤٤٨ هـ), but **the grid is the Gregorian month** (days 1–31, today = 15). `utils/date.ts calendarParts` falls back to Gregorian when `formatToParts` with `<base>-u-ca-islamic-nu-latn` returns unparseable parts, so Hermes' iOS Intl probably ignores the `-u-ca`/`-nu` extensions [INFERENCE]. An in-app Intl probe was added to `calendar.tsx` but never captured. **Workaround:** build the Hijri grid ourselves (for example with a tabular or Umm al-Qura library) and feed Calendar Gregorian dates, or patch `calendarParts` to normalise Arabic-Indic digits. |
| DatePicker (trigger) | OK | OK | The trigger mirrors with the icon on the right. The open popover was not captured. |
| BarChart | OK | OK | Categories mirror (الفجر on the right) and the Y axis moves to the right. In RTL the Y-axis labels overlap the last bar slightly (24.8 / 16.5 / 8.3 drawn over the bar), which is cosmetic. |
| LineChart | OK | OK | The X axis mirrors (السبت on the right) and the series is drawn right to left. |
| Dialog | OK | OK | Title and text are right-aligned and the footer buttons mirror. |
| BottomSheet (Panel, JS) | OK | OK | Rows and header mirror and the close button is on the left. |
| BottomSheet (Panel `native`) | OK | OK | The content is RN views, so it mirrors. |
| BottomSheet `@expo/ui` (SwiftUI `.sheet`) | OK | **Broken** | The content **does not mirror**: it is identical to LTR, even though `Host` defaults `layoutDirection` from I18nManager. SwiftUI's sheet presentation does not inherit it, and `@expo/ui` has no `layoutDirection` environment modifier. **Candidate workarounds:** set the device/app language to Arabic so UIKit/SwiftUI is RTL natively; put RN content in the sheet through `RNHostView` (added but not captured); or use Panel's `BottomSheet native`, which did mirror. |
| Toast | OK | OK | Shown at the bottom above the tab bar. The icon and close button mirror. |
| Native tabs (`expo-router/native-tabs`) | OK | **Broken** | The tab order is **not mirrored** (النماذج stays on the left). UIKit's tab bar follows the system/app language, not RN's forceRTL. **Workaround:** ship an Arabic localisation (`CFBundleLocalizations`/`supportedLocales: ['ar']`, making Arabic the app language so UIKit is RTL), or reverse the trigger order when `I18nManager.isRTL`. Neither was verified. |
| Bidi text | — | Note | A Latin label that starts with a symbol, such as `ورقة @expo/ui`, is shown as `expo/ui@` in an RTL paragraph. This is normal Unicode bidi; wrap such runs in LRM/LRI. |
| Arabic font | OK | OK | The system font renders Arabic, Arabic-Indic digits and mixed text well. No custom font was needed. |

## Not verified (cancelled)

- Android: all of it (skipped by user decision; disk constraints).
- Whether the Tabs indicator patch works, the Hijri Intl probe output, the `@expo/ui` sheet with `RNHostView`, open states of DatePicker, the native Select and the LTR Panel Select, and slider drag direction.
- The `forcesRTL: true` config plugin run end-to-end through prebuild. Only the Info.plist key it writes was tested, by editing the built `.app`.

## Screenshots

`screenshots/ios-{ltr,rtl}-<name>.png`, where `<name>` is forms-1 (card and rows), forms-2 (switch, slider, tabs, progress), forms-3 (RTL only: inputs and selects), calendar-1 (Gregorian and DatePicker), calendar-2 (Hijri), calendar-3 (charts), overlays, dialog, sheet-panel, sheet-panel-native, sheet-expoui and toast. There is also `ios-rtl-select-open.png`. Side-by-side LTR|RTL images are in `screenshots/pairs/pair-<name>.png`.

## Verdict on adopting Panel UI for an Arabic-first app

**Adopt.** Panel UI is clearly RTL-aware: it has `Direction` and `useDirection`, icons flip, and Switch, Slider, Progress, Calendar and the charts negate raw-pixel geometry. Almost every component mirrored correctly. Before building, plan for these:

1. Force RTL with `expo-localization` `forcesRTL: true`, not with runtime `I18nManager.forceRTL`.
2. Patch the Tabs indicator, or avoid segmented Tabs until it is fixed upstream (report it to Panel UI).
3. Do not rely on `calendar="islamic"` on Hermes/iOS. Drive the Hijri grid ourselves.
4. Default `textAlign` to the start edge in our Input wrapper.
5. Native shells (native tabs, `@expo/ui` SwiftUI sheets) need the app's language to be Arabic for UIKit/SwiftUI to mirror. Verify that in the scaffold before relying on them.

## Cleanup done

The simulator was shut down. DerivedData, `ios/build`, `ios/Pods` and the android build dirs were deleted. No Metro was running (Release builds). The `alrisali-spike2` simulator device still exists.
