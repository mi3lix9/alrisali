import "../i18n";
import { nextPrayerTime } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Button, Card, Item, Text } from "panelui-native";
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

/**
 * Home's countdown to the next visible Prayer Time, the lead widget of its
 * grid; opens the Prayer tab.
 */
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
    <Card className="bg-primary border-primary">
      <Item
        testID="next-prayer"
        orientation="vertical"
        className="gap-1 p-6"
        accessibilityLabel={t("next.accessibility", {
          name,
          time,
          countdown,
        })}
        onPress={() => router.navigate("/prayer")}
      >
        <Text size="sm" className="text-primary-foreground opacity-70">
          {t("next.title")}
        </Text>
        <View className="w-full flex-row items-baseline justify-between gap-2">
          <Text size="2xl" weight="bold" className="text-primary-foreground">
            {name}
          </Text>
          <Text
            weight="semibold"
            className="text-primary-foreground"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {t("next.at", { time })}
          </Text>
        </View>
        <Text
          size="3xl"
          weight="semibold"
          className="text-primary-foreground"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {countdown}
        </Text>
      </Item>
    </Card>
  );
};
