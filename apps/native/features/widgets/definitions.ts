import type { WidgetProps } from "@alrisali/domain/widgets";
import { createWidget } from "expo-widgets";

import { WIDGET_NAMES } from "./data/names";
import { renderWidget } from "./layout/widget-layout";

// Shown in the widget gallery, and until the app first writes its data. This
// file is also what the native builds run to learn each widget's layout
// (`initialLayout` in app.config.ts): it may import only relative modules.
const gallery = (title: string) => ({
  size: 1 as const,
  views: [
    {
      from: 0,
      link: "alrisali://next-salah",
      blocks: [
        {
          type: "text" as const,
          text: title,
          style: "title" as const,
          tone: "accent" as const,
          min: 1 as const,
        },
      ],
    },
  ],
});

export const WIDGETS = {
  "next-salah": createWidget<WidgetProps>(
    WIDGET_NAMES["next-salah"],
    renderWidget,
    gallery("الصلاة القادمة · Next prayer")
  ),
  "today-times": createWidget<WidgetProps>(
    WIDGET_NAMES["today-times"],
    renderWidget,
    gallery("أوقات اليوم · Today's times")
  ),
  "hijri-date": createWidget<WidgetProps>(
    WIDGET_NAMES["hijri-date"],
    renderWidget,
    gallery("التاريخ الهجري · Hijri date")
  ),
  "verse-of-the-day": createWidget<WidgetProps>(
    WIDGET_NAMES["verse-of-the-day"],
    renderWidget,
    gallery("آية اليوم · Verse of the Day")
  ),
  "keep-reading": createWidget<WidgetProps>(
    WIDGET_NAMES["keep-reading"],
    renderWidget,
    gallery("تابع القراءة · Keep reading")
  ),
  khatmah: createWidget<WidgetProps>(
    WIDGET_NAMES.khatmah,
    renderWidget,
    gallery("الختمة · Khatmah")
  ),
};
