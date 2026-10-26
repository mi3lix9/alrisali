import "../i18n";
import type {
  Location,
  PrayerTimeName,
  TimeFormat,
} from "@alrisali/domain/shared";
import { BottomSheet } from "panelui-native";
import { useTranslation } from "react-i18next";

import { LocationCard } from "./location-card";
import { OptionsCard } from "./options-card";

/** The Believer's location and Prayer Times options, in a sheet. */
export const PrayerSettingsSheet = ({
  open,
  onOpenChange,
  location,
  followsDevice,
  timeFormat,
  imsakMinutes,
  hidden,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  followsDevice: boolean;
  timeFormat: TimeFormat;
  imsakMinutes: number;
  hidden: readonly PrayerTimeName[];
}) => {
  const { t } = useTranslation("prayer-times");
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheet.Content size="full">
        <BottomSheet.Header title={t("settings.title")} />
        <BottomSheet.Body className="gap-4 pb-6">
          <LocationCard location={location} followsDevice={followsDevice} />
          <OptionsCard
            timeFormat={timeFormat}
            imsakMinutes={imsakMinutes}
            hidden={hidden}
          />
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
