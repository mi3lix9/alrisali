import "../i18n";
import { qiblaBearing, qiblaDistanceKm } from "@alrisali/domain/qibla";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { useBelieverSettings } from "@/shared/lib/believer-settings";
import { WidgetTile } from "@/shared/ui/widget";

import { bearingSector, wholeNumber } from "../utils/format";

const openQibla = () => router.push("/qibla");

/**
 * Home's half-width Qibla tile: the bearing from the Believer's location and
 * the distance to the Kaaba; opens the compass.
 */
export const QiblaTile = () => {
  const { t } = useTranslation("qibla");
  const { data: believer } = useBelieverSettings();
  const location = believer?.location;

  if (!location) {
    return (
      <WidgetTile
        testID="qibla-tile"
        label={t("title")}
        value={t("noLocation.title")}
        onPress={openQibla}
      />
    );
  }

  const bearing = qiblaBearing(location);
  const degrees = wholeNumber.format(Math.round(bearing));
  const direction = t(`directions.${bearingSector(bearing)}`);
  const distance = t("distance", {
    distance: wholeNumber.format(qiblaDistanceKm(location)),
  });

  return (
    <WidgetTile
      testID="qibla-tile"
      label={t("title")}
      value={t("bearing", { degrees, direction })}
      caption={distance}
      accessibilityLabel={`${t("bearingLabel", { degrees, direction })}, ${distance}`}
      onPress={openQibla}
    />
  );
};
