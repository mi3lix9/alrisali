import "../i18n";
import { nextPrayerTime } from "@alrisali/domain/shared";
import { Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  useFollowDeviceLocation,
  useLocateDevice,
} from "../hooks/use-device-location";
import { useNow } from "../hooks/use-now";
import { usePrayerTimesView } from "../hooks/use-prayer-times-settings";
import { formatClockTime, formatCountdown } from "../utils/format";

const SECOND_MS = 1000;

/** Home's countdown to the next visible Prayer Time. */
export const NextPrayerCard = () => {
  const { t } = useTranslation("prayer-times");
  useFollowDeviceLocation();
  const view = usePrayerTimesView();
  const now = useNow(SECOND_MS);
  const {
    mutate: locate,
    isPending: locating,
    data: outcome,
  } = useLocateDevice();

  if (!view) {
    return null;
  }

  if (!view.settings) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>{t("next.title")}</Card.Title>
          <Card.Description>
            {outcome === "denied" || outcome === "unavailable"
              ? t(`location.${outcome}`)
              : t("next.noLocation")}
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <Button onPress={() => locate()} loading={locating}>
            {t("location.useDevice")}
          </Button>
        </Card.Footer>
      </Card>
    );
  }

  const next = nextPrayerTime(now, view.settings, view.hidden);
  if (!next) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>{t("next.title")}</Card.Title>
          <Card.Description>{t("next.none")}</Card.Description>
        </Card.Header>
      </Card>
    );
  }

  const name = t(`names.${next.name}`);
  const time = formatClockTime(next.at, view.timeFormat);
  const countdown = formatCountdown(next.at.since(now).total("seconds"));

  return (
    <Card>
      <Card.Header>
        <Card.Description>{t("next.title")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <View
          accessible
          accessibilityLabel={t("next.accessibility", {
            name,
            time,
            countdown,
          })}
          className="gap-1"
        >
          <Text size="2xl" weight="bold">
            {name}
          </Text>
          <Text
            size="3xl"
            weight="semibold"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {countdown}
          </Text>
          <Text muted>{t("next.at", { time })}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};
