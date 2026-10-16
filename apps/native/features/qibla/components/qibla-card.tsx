import {
  isFacingQibla,
  qiblaBearing,
  qiblaDistanceKm,
  qiblaOffset,
} from "@alrisali/domain/qibla";
import type { Location } from "@alrisali/domain/shared";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { Alert, Card, Text } from "panelui-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useCompass } from "../hooks/use-compass";
import { bearingSector, formatWholeNumber } from "../utils/format";
import { CompassStatus } from "./compass-status";
import { QiblaDial } from "./qibla-dial";

const playFacingHaptic = async (): Promise<void> => {
  try {
    await notificationAsync(NotificationFeedbackType.Success);
  } catch {
    // A device without haptics still shows the facing state.
  }
};

/**
 * The Qibla from a location: its bearing and distance, and a live compass
 * that shows, with a haptic, when the device faces it.
 */
export const QiblaCard = ({ location }: { location: Location }) => {
  const { t } = useTranslation("qibla");
  const { compass, allow } = useCompass();
  const bearing = qiblaBearing(location);
  const heading = compass.status === "live" ? compass.heading : null;
  const facing = heading !== null && isFacingQibla(heading, bearing);

  useEffect(() => {
    if (facing) {
      playFacingHaptic();
    }
  }, [facing]);

  const degrees = formatWholeNumber(Math.round(bearing));
  const direction = t(`directions.${bearingSector(bearing)}`);
  const distance = t("distance", {
    distance: formatWholeNumber(qiblaDistanceKm(location)),
  });

  let guidance = t("facing");
  if (heading !== null && !facing) {
    const offset = qiblaOffset(heading, bearing);
    const turn = { degrees: formatWholeNumber(Math.abs(offset)) };
    guidance = offset > 0 ? t("turnRight", turn) : t("turnLeft", turn);
  }

  return (
    <>
      <Card>
        <Card.Header>
          <Card.Title
            accessibilityLabel={t("bearingLabel", { degrees, direction })}
          >
            {t("bearing", { degrees, direction })}
          </Card.Title>
          <Card.Description>
            {location.name ? `${location.name} · ${distance}` : distance}
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          <QiblaDial heading={heading} bearing={bearing} facing={facing} />
          {compass.status === "live" ? (
            <Text
              size="lg"
              weight="semibold"
              className={facing ? "text-success text-center" : "text-center"}
              accessibilityLiveRegion="polite"
            >
              {guidance}
            </Text>
          ) : (
            <CompassStatus compass={compass} allow={allow} />
          )}
        </Card.Content>
      </Card>
      {compass.status === "live" && compass.needsCalibration ? (
        <Alert variant="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("compass.calibrateTitle")}</Alert.Title>
            <Alert.Description>
              {t("compass.calibrateDescription", { figure: 8 })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      {compass.status === "live" && !compass.trueNorth ? (
        <Text size="sm" muted>
          {t("compass.magneticNorth")}
        </Text>
      ) : null}
    </>
  );
};
