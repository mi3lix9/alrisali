import "../i18n";
import { Spinner } from "panelui-native";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { Screen } from "@/shared/ui/screen";

import { LocationCard } from "../components/location-card";
import { OptionsCard } from "../components/options-card";
import { TimetableCard } from "../components/timetable-card";
import { useFollowDeviceLocation } from "../hooks/use-device-location";
import { usePrayerTimesView } from "../hooks/use-prayer-times-settings";

/** The Prayer tab: today's timetable, its location and its options. */
export const PrayerTimesScreen = () => {
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
      {settings ? <TimetableCard view={{ ...view, settings }} /> : null}
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
