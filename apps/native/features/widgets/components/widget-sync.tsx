import type {
  PrayerTimeName,
  PrayerTimesSettings,
  TimeFormat,
} from "@alrisali/domain/shared";
import { widgetEntries } from "@alrisali/domain/widgets";
import type { WidgetLinks, WidgetSources } from "@alrisali/domain/widgets";
import { captureException } from "@sentry/react-native";
import { getCalendars } from "expo-localization";
import { useEffect } from "react";
import { AppState } from "react-native";
import { Temporal } from "temporal-polyfill";

import { useHijriCalendar } from "@/shared/lib/hijri-calendar";

import { syncWidgets } from "../utils/sync-widgets";
import { useWidgetText } from "../utils/use-widget-text";

interface WidgetSyncProps {
  /** The Prayer Times view; undefined while it loads. */
  prayerTimes:
    | {
        settings: PrayerTimesSettings | null;
        hidden: readonly PrayerTimeName[];
        timeFormat: TimeFormat;
      }
    | undefined;
  /** The Quran and Khatmah data; undefined while it loads. */
  sources: WidgetSources | undefined;
  links: WidgetLinks;
}

/**
 * Mounted once at the root: writes what the home-screen widgets show whenever
 * anything they show changes (the Prayer Times settings, the Last-Read Ayah,
 * the Khatmah, the Hijri calendar, the language) and whenever the app returns
 * to the foreground, which extends the timeline. The route passes the data in,
 * since a feature does not import another. Renders nothing.
 */
export const WidgetSync = ({
  prayerTimes,
  sources,
  links,
}: WidgetSyncProps) => {
  const words = useWidgetText(prayerTimes?.timeFormat ?? "24h");
  const hijri = useHijriCalendar();

  useEffect(() => {
    if (!prayerTimes || !sources) {
      return;
    }
    const write = () => {
      try {
        const entries = widgetEntries(
          {
            prayerTimes: prayerTimes.settings
              ? {
                  settings: prayerTimes.settings,
                  hidden: prayerTimes.hidden,
                }
              : null,
            deviceTimeZone:
              getCalendars()[0]?.timeZone ?? Temporal.Now.timeZoneId(),
            hijri,
            ...sources,
          },
          Temporal.Now.instant()
        );
        syncWidgets(entries, words, links);
      } catch (error) {
        // Tried again on the next change or foreground.
        captureException(error);
      }
    };
    write();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        write();
      }
    });
    return () => subscription.remove();
  }, [prayerTimes, sources, links, hijri, words]);

  return null;
};
