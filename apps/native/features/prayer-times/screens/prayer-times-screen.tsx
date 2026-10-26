import "../i18n";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { locationTimeZone } from "@alrisali/domain/shared";
import { useIsFocused } from "expo-router";
import { Spinner } from "panelui-native";
import { useState } from "react";
import type { ReactNode } from "react";
import type { Temporal } from "temporal-polyfill";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { Screen } from "@/shared/ui/screen";

import { HighLatitudePrompt } from "../components/high-latitude-prompt";
import { NextPrayerHero } from "../components/next-prayer-hero";
import { PrayerHeader } from "../components/prayer-header";
import { PrayerSettingsSheet } from "../components/prayer-settings-sheet";
import { PrayerTimesWarning } from "../components/prayer-times-warning";
import { TimetableCard } from "../components/timetable-card";
import { useFollowDeviceLocation } from "../hooks/use-device-location";
import { useNow } from "../hooks/use-now";
import { usePrayerTimesView } from "../hooks/use-prayer-times-settings";
import { locationToday } from "../utils/day-navigation";
import type { SharedTimes } from "../utils/shared-times";

const MINUTE_MS = 60_000;

/**
 * The Prayer tab: a header with the shown day and the location, the next
 * Prayer Time's countdown, the timetable of today or any day the Believer
 * moves to, and the location and options in a sheet.
 * `children` (another feature's card, from the route) shows under the
 * timetable; `timetableRowActions` ends each timetable row and
 * `timetableShare` shares today's times.
 */
export const PrayerTimesScreen = ({
  children,
  timetableRowActions,
  timetableShare,
}: {
  children?: ReactNode;
  timetableRowActions?: (name: PrayerTimeName) => ReactNode;
  timetableShare?: (times: SharedTimes) => ReactNode;
}) => {
  useFollowDeviceLocation();
  const view = usePrayerTimesView();
  const { data: believer } = useBelieverSettings();
  const focused = useIsFocused();
  const now = useNow(MINUTE_MS, focused);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // null is today, so midnight at the location carries the screen along.
  const [shown, setShown] = useState<Temporal.PlainDate | null>(null);

  if (!view || !believer) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    );
  }

  const { settings } = view;
  const today = settings
    ? locationToday(now, locationTimeZone(settings.coordinates))
    : null;
  return (
    <>
      <Screen>
        <PrayerHeader
          today={today}
          shown={shown}
          location={believer.location}
          onShow={setShown}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <NextPrayerHero view={view} active={focused} />
        {settings && today ? (
          <>
            <PrayerTimesWarning
              view={{ ...view, settings }}
              date={shown ?? today}
            />
            <HighLatitudePrompt coordinates={settings.coordinates} />
            <TimetableCard
              view={{ ...view, settings }}
              date={shown ?? today}
              rowActions={timetableRowActions}
              placeName={believer.location?.name}
              shareAction={timetableShare}
              active={focused}
            />
          </>
        ) : null}
        {children}
      </Screen>
      <PrayerSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        location={believer.location}
        followsDevice={believer.locationFollowsDevice}
        timeFormat={view.timeFormat}
        imsakMinutes={believer.imsakMinutes}
        hidden={view.hidden}
      />
    </>
  );
};
