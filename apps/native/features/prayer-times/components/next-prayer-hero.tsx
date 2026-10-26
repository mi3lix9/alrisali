import "../i18n";
import { Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useLocateDevice } from "../hooks/use-device-location";
import { useNow } from "../hooks/use-now";
import type { PrayerTimesView } from "../hooks/use-prayer-times-settings";
import { formatClockTime, formatCountdown } from "../utils/format";
import { nextPrayerProgress } from "../utils/next-prayer-progress";

const SECOND_MS = 1000;
const PERCENT = 100;

/**
 * The Prayer tab's lead card: the next visible Prayer Time, its clock time, a
 * live countdown and how far it is from the previous Prayer Time to it.
 * Without a location it asks for one. `active` is false while the tab is
 * out of focus, which stops the clock ticking.
 */
export const NextPrayerHero = ({
  view,
  active,
}: {
  view: PrayerTimesView;
  active: boolean;
}) => {
  const { t } = useTranslation("prayer-times");
  const now = useNow(SECOND_MS, active);
  const {
    mutate: locate,
    isPending: locating,
    data: outcome,
  } = useLocateDevice();

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

  const progress = nextPrayerProgress(now, view.settings, view.hidden);
  if (!progress) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>{t("next.title")}</Card.Title>
          <Card.Description>{t("next.none")}</Card.Description>
        </Card.Header>
      </Card>
    );
  }

  const { current, next, secondsLeft, fraction } = progress;
  const name = t(`names.${next.name}`);
  const time = formatClockTime(next.at, view.timeFormat);
  const countdown = formatCountdown(secondsLeft);

  return (
    <Card className="bg-primary border-primary">
      <View
        testID="next-prayer"
        accessible
        accessibilityLabel={t("next.accessibility", { name, time, countdown })}
        className="gap-1 p-6"
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
        <View className="bg-primary-foreground/20 mt-3 h-1.5 w-full overflow-hidden rounded-full">
          <View
            className="bg-primary-foreground h-full rounded-full"
            style={{ width: `${Math.round(fraction * PERCENT)}%` }}
          />
        </View>
        {current ? (
          <View className="flex-row justify-between">
            <Text
              size="sm"
              className="text-primary-foreground opacity-70"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {`${t(`names.${current.name}`)} ${formatClockTime(current.at, view.timeFormat)}`}
            </Text>
            <Text size="sm" className="text-primary-foreground opacity-70">
              {name}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
};
