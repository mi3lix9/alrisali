import "../i18n";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { locationTimeZone } from "@alrisali/domain/shared";
import { Spinner } from "panelui-native";
import { useState } from "react";
import type { ReactNode } from "react";
import type { Temporal } from "temporal-polyfill";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { Screen } from "@/shared/ui/screen";

import { DayNavigationCard } from "../components/day-navigation-card";
import { LocationCard } from "../components/location-card";
import { OptionsCard } from "../components/options-card";
import { TimetableCard } from "../components/timetable-card";
import { useFollowDeviceLocation } from "../hooks/use-device-location";
import { useNow } from "../hooks/use-now";
import { usePrayerTimesView } from "../hooks/use-prayer-times-settings";
import { locationToday } from "../utils/day-navigation";

const MINUTE_MS = 60_000;

/**
 * The Prayer tab: the timetable of today or any day the Believer moves to, its location and its options.
 * `children` (another feature's card, from the route) shows under the
 * timetable; `timetableRowActions` ends each timetable row.
 */
export const PrayerTimesScreen = ({
  children,
  timetableRowActions,
}: {
  children?: ReactNode;
  timetableRowActions?: (name: PrayerTimeName) => ReactNode;
}) => {
  useFollowDeviceLocation();
  const view = usePrayerTimesView();
  const { data: believer } = useBelieverSettings();
  const now = useNow(MINUTE_MS);
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
    <Screen>
      {settings && today ? (
        <>
          <DayNavigationCard
            view={{ ...view, settings }}
            today={today}
            shown={shown}
            onShow={setShown}
          />
          <TimetableCard
            view={{ ...view, settings }}
            date={shown ?? today}
            rowActions={timetableRowActions}
          />
        </>
      ) : null}
      {children}
      <LocationCard
        location={believer.location}
        followsDevice={believer.locationFollowsDevice}
      />
      <OptionsCard
        timeFormat={view.timeFormat}
        imsakMinutes={believer.imsakMinutes}
        hidden={view.hidden}
      />
    </Screen>
  );
};
