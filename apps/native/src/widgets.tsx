import { useMemo } from "react";

import { useKhatmahData } from "@/features/khatmah";
import { usePrayerTimesView } from "@/features/prayer-times";
import { useQuranLastRead } from "@/features/quran";
import { WidgetSync } from "@/features/widgets";

import { WIDGET_LINKS, widgetSources } from "./widget-sources";

/**
 * The home-screen widgets show Prayer Times, the Last-Read Ayah, the Verse of
 * the Day and the Khatmah. Features do not import features, so the root
 * composes them: this reads each feature's data and hands it to the widgets.
 */
export const Widgets = () => {
  const prayerTimes = usePrayerTimesView();
  const khatmah = useKhatmahData();
  const lastRead = useQuranLastRead();
  const lastReadAyah = lastRead.isSuccess
    ? (lastRead.data?.ayah ?? null)
    : undefined;
  const khatmahs = khatmah.data?.khatmahs;
  const logs = khatmah.data?.logs;

  const sources = useMemo(
    () =>
      khatmahs && logs && lastReadAyah !== undefined
        ? widgetSources({ khatmahs, logs, lastRead: lastReadAyah })
        : undefined,
    [khatmahs, logs, lastReadAyah]
  );

  return (
    <WidgetSync
      prayerTimes={prayerTimes}
      sources={sources}
      links={WIDGET_LINKS}
    />
  );
};
