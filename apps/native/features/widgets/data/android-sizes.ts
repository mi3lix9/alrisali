import type { WidgetKind, WidgetSize } from "@alrisali/domain/widgets";

/**
 * The size each Android widget is added at (its cells in app.config.ts). Android
 * gives a layout no size; iOS tells it the family.
 */
export const ANDROID_SIZES: Record<WidgetKind, WidgetSize> = {
  "next-salah": 1,
  "today-times": 1,
  "hijri-date": 1,
  "verse-of-the-day": 2,
  "keep-reading": 1,
  khatmah: 2,
};
