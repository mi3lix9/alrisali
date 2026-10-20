import {
  DEFAULT_QIBLA_TARGET,
  isShrine,
  magneticDeclination,
  qiblaAlignment,
  qiblaOffset,
  targetBearing,
  targetDistanceKm,
} from "@alrisali/domain/qibla";
import type { Location } from "@alrisali/domain/shared";
import { notificationAsync, NotificationFeedbackType } from "expo-haptics";
import { Alert, Card, Text } from "panelui-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { joinParts } from "@/shared/lib/i18n";
import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";

import {
  useQiblaSettings,
  useUpdateQiblaSettings,
} from "../data/qibla-settings";
import { useCompass } from "../hooks/use-compass";
import { bearingSector, formatWholeNumber } from "../utils/format";
import { CompassStatus } from "./compass-status";
import { LevelBubble } from "./level-bubble";
import { QiblaDial } from "./qibla-dial";
import { TargetChips } from "./target-chips";

const playFacingHaptic = async (): Promise<void> => {
  try {
    await notificationAsync(NotificationFeedbackType.Success);
  } catch {
    // A device without haptics still shows the facing state.
  }
};

const GUIDANCE_COLOUR = {
  facing: "text-success",
  near: "text-warning",
  away: "",
} as const;

/**
 * The Qibla, or a Shrine the Believer chose, from a location: its bearing from
 * true north and distance, the
 * magnetic declination the compass is corrected with, and a live compass that
 * shows when the device is near the Qibla and, with a haptic, when it faces it.
 */
export const QiblaCard = ({ location }: { location: Location }) => {
  const { t } = useTranslation("qibla");
  const today = useToday();
  const declination = magneticDeclination(location, today);
  const { compass, allow } = useCompass(declination);
  const { data: settings } = useQiblaSettings();
  const { mutate: update } = useUpdateQiblaSettings();
  const target = settings?.target ?? DEFAULT_QIBLA_TARGET;
  const shrine = isShrine(target);
  const targetName = t(`targets.${target}`);
  const bearing = targetBearing(location, target);
  const heading = compass.status === "live" ? compass.heading : null;
  const alignment = heading === null ? null : qiblaAlignment(heading, bearing);
  const facing = alignment === "facing";

  // Once on entering the facing state, not on every reading inside it.
  useEffect(() => {
    if (facing) {
      playFacingHaptic();
    }
  }, [facing]);

  const degrees = formatWholeNumber(Math.round(bearing));
  const direction = t(`directions.${bearingSector(bearing)}`);
  const distance = t("distance", {
    distance: formatWholeNumber(targetDistanceKm(location, target)),
    target: targetName,
  });
  const correction = {
    degrees: formatNumber(Math.abs(declination), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
    direction: declination < 0 ? t("declinationWest") : t("declinationEast"),
  };

  let guidance = shrine
    ? t("facingTarget", { target: targetName })
    : t("facing");
  if (heading !== null && alignment !== "facing") {
    const offset = qiblaOffset(heading, bearing);
    const turn = { degrees: formatWholeNumber(Math.abs(offset)) };
    if (alignment === "near") {
      guidance = offset > 0 ? t("nearRight") : t("nearLeft");
    } else {
      guidance = offset > 0 ? t("turnRight", turn) : t("turnLeft", turn);
    }
  }

  return (
    <>
      <Card>
        <Card.Header>
          <Card.Title
            accessibilityLabel={
              shrine
                ? t("bearingTargetLabel", {
                    target: targetName,
                    degrees,
                    direction,
                  })
                : t("bearingLabel", { degrees, direction })
            }
          >
            {t("bearing", { degrees, direction })}
          </Card.Title>
          <Card.Description>
            {location.name ? joinParts([location.name, distance]) : distance}
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          <TargetChips
            target={target}
            onSelect={(next) => update({ target: next })}
          />
          {shrine ? (
            <Text size="sm" muted testID="qibla-not-qibla">
              {t("notQibla", { target: targetName })}
            </Text>
          ) : null}
          <QiblaDial
            heading={heading}
            bearing={bearing}
            alignment={alignment}
          />
          {compass.status === "live" && alignment ? (
            <Text
              size="lg"
              weight="semibold"
              className={`text-center ${GUIDANCE_COLOUR[alignment]}`}
              accessibilityLiveRegion="polite"
              testID="qibla-guidance"
            >
              {guidance}
            </Text>
          ) : null}
          {compass.status === "live" ? null : (
            <CompassStatus compass={compass} allow={allow} />
          )}
          <LevelBubble />
          <Text
            size="sm"
            muted
            className="text-center"
            accessibilityLabel={t("declinationLabel", correction)}
            testID="qibla-declination"
          >
            {t("declination", correction)}
          </Text>
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
    </>
  );
};
