import "../i18n";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { Spinner } from "panelui-native";
import type { ReactNode } from "react";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { Screen } from "@/shared/ui/screen";

import { LocationCard } from "../components/location-card";
import { OptionsCard } from "../components/options-card";
import { TimetableCard } from "../components/timetable-card";
import { useFollowDeviceLocation } from "../hooks/use-device-location";
import { usePrayerTimesView } from "../hooks/use-prayer-times-settings";
import type { SharedTimes } from "../utils/shared-times";

/**
 * The Prayer tab: today's timetable, its location and its options.
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

  if (!view || !believer) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    );
  }

  const { settings } = view;
  return (
    <Screen>
      {settings ? (
        <TimetableCard
          view={{ ...view, settings }}
          rowActions={timetableRowActions}
          placeName={believer.location?.name}
          shareAction={timetableShare}
        />
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
