import "../i18n";
import type { Location } from "@alrisali/domain/shared";
import { Chip, Text } from "panelui-native";
import { ChevronDownIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";

import { useNow } from "../hooks/use-now";

const MINUTE_MS = 60_000;
// A place is saved as "City, Region, Country"; the chip shows the city.
const PLACE_SEPARATOR = /[,،]/u;
const WEEKDAY_DATE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

/**
 * The top of the Prayer tab: today's Hijri and Gregorian dates and a chip
 * with the city that opens the location and options sheet.
 */
export const PrayerHeader = ({
  location,
  active,
  onOpenSettings,
}: {
  location: Location | null;
  active: boolean;
  onOpenSettings: () => void;
}) => {
  const { t } = useTranslation("prayer-times");
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  const today = useNow(MINUTE_MS, active).toPlainDate();

  let place = t("next.setLocation");
  if (location) {
    place =
      location.name?.split(PLACE_SEPARATOR)[0]?.trim() || t("location.unnamed");
  }

  return (
    <View className="gap-2">
      <View className="gap-0.5">
        <Text weight="semibold" size="lg">
          {formatHijriDate(calendar.toHijri(today))}
        </Text>
        <Text muted>{formatGregorianDate(today, WEEKDAY_DATE)}</Text>
      </View>
      <Chip
        variant="outline"
        size="lg"
        testID="prayer-location-chip"
        accessibilityRole="button"
        accessibilityLabel={t("header.settings", { place })}
        onPress={onOpenSettings}
      >
        <Chip.Label>{place}</Chip.Label>
        <ChevronDownIcon size={14} />
      </Chip>
    </View>
  );
};
