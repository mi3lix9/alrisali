import "../i18n";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { useIsFocused } from "expo-router";
import { Spinner } from "panelui-native";
import { useState } from "react";
import type { ReactNode } from "react";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { Screen } from "@/shared/ui/screen";

import { NextPrayerHero } from "../components/next-prayer-hero";
import { PrayerHeader } from "../components/prayer-header";
import { PrayerSettingsSheet } from "../components/prayer-settings-sheet";
import { TimetableCard } from "../components/timetable-card";
import { useFollowDeviceLocation } from "../hooks/use-device-location";
import { usePrayerTimesView } from "../hooks/use-prayer-times-settings";

/**
 * The Prayer tab: a header with the date and the location, the next Prayer
 * Time's countdown, today's timetable, and the location and options in a
 * sheet. `children` (other features' cards, from the route) show under the
 * timetable; `renderReminder` draws a Prayer Time's Reminder bell.
 */
export const PrayerTimesScreen = ({
  renderReminder,
  children,
}: {
  renderReminder: (name: PrayerTimeName, time: string | null) => ReactNode;
  children?: ReactNode;
}) => {
  useFollowDeviceLocation();
  const focused = useIsFocused();
  const view = usePrayerTimesView();
  const { data: believer } = useBelieverSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!view || !believer) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    );
  }

  const { settings } = view;
  return (
    <>
      <Screen>
        <PrayerHeader
          location={believer.location}
          active={focused}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <NextPrayerHero view={view} active={focused} />
        {settings ? (
          <TimetableCard
            view={{ ...view, settings }}
            active={focused}
            renderReminder={renderReminder}
          />
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
