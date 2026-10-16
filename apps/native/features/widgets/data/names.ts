import type { WidgetKind } from "@alrisali/domain/widgets";

/**
 * The name each widget is registered under: the widget's Swift struct and
 * Kotlin provider, and the key `app.config.ts` lists it by (its test keeps
 * the two equal).
 */
export const WIDGET_NAMES = {
  "next-salah": "AlrisaliNextSalah",
  "today-times": "AlrisaliTodayTimes",
  "hijri-date": "AlrisaliHijriDate",
  "verse-of-the-day": "AlrisaliVerseOfTheDay",
  "keep-reading": "AlrisaliKeepReading",
  khatmah: "AlrisaliKhatmah",
} as const satisfies Record<WidgetKind, string>;
