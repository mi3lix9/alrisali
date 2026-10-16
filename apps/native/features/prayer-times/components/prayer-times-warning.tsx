import {
  calculatePrayerTimes,
  prayerTimesSanity,
  locationTimeZone,
} from "@alrisali/domain/shared";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Alert, Button } from "panelui-native";
import { useTranslation } from "react-i18next";
import type { Temporal } from "temporal-polyfill";

import { joinParts } from "@/shared/lib/i18n";

import type { PrayerTimesView } from "../hooks/use-prayer-times-settings";

/**
 * Warns when a shown day's Prayer Times cannot all be calculated or fall out
 * of order, and links to the Prayer settings that can fix it. Nothing shows
 * when the day is sound.
 */
export const PrayerTimesWarning = ({
  view,
  date,
}: {
  view: PrayerTimesView & {
    settings: NonNullable<PrayerTimesView["settings"]>;
  };
  date: Temporal.PlainDate;
}) => {
  const { t } = useTranslation("prayer-times");
  const times = calculatePrayerTimes(
    date,
    locationTimeZone(view.settings.coordinates),
    view.settings
  );
  const problems = prayerTimesSanity(times, view.hidden);
  if (problems.length === 0) {
    return null;
  }
  const named = (names: readonly PrayerTimeName[]) =>
    joinParts(names.map((name) => t(`names.${name}`)));
  const undefinedNames = problems.flatMap((problem) =>
    problem.kind === "undefined" ? [problem.name] : []
  );
  const outOfOrderNames = problems.flatMap((problem) =>
    problem.kind === "outOfOrder" ? [problem.name] : []
  );

  return (
    <Alert variant="warning" testID="prayer-times-warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("sanity.title")}</Alert.Title>
        {undefinedNames.length > 0 ? (
          <Alert.Description>
            {t("sanity.undefined", { names: named(undefinedNames) })}
          </Alert.Description>
        ) : null}
        {outOfOrderNames.length > 0 ? (
          <Alert.Description>
            {t("sanity.outOfOrder", { names: named(outOfOrderNames) })}
          </Alert.Description>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          testID="prayer-times-warning-fix"
          onPress={() => router.push("/settings/prayer")}
        >
          {t("sanity.fix")}
        </Button>
      </Alert.Content>
    </Alert>
  );
};
