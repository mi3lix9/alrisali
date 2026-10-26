import {
  calculatePrayerTimes,
  currentPrayerTime,
  PRAYER_TIMES,
} from "@alrisali/domain/shared";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { Badge, Card, Item } from "panelui-native";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { useNow } from "../hooks/use-now";
import type { PrayerTimesView } from "../hooks/use-prayer-times-settings";
import { formatClockTime } from "../utils/format";

const MINUTE_MS = 60_000;

/**
 * Today's visible Prayer Times, with the one in progress marked and the ones
 * already past dimmed. `renderReminder` is the route's Reminder bell for a
 * Prayer Time (given its time as the row shows it), drawn at the end of its row. `active` is false while the tab
 * is out of focus.
 */
export const TimetableCard = ({
  view,
  active,
  renderReminder,
}: {
  view: PrayerTimesView & {
    settings: NonNullable<PrayerTimesView["settings"]>;
  };
  active: boolean;
  renderReminder: (name: PrayerTimeName, time: string | null) => ReactNode;
}) => {
  const { t } = useTranslation("prayer-times");
  const now = useNow(MINUTE_MS, active);
  const { settings, hidden, timeFormat } = view;
  const times = calculatePrayerTimes(
    now.toPlainDate(),
    now.timeZoneId,
    settings
  );
  const current = currentPrayerTime(now, settings, hidden);
  const shown = PRAYER_TIMES.filter((name) => !hidden.includes(name));
  const isCurrent = (name: PrayerTimeName) =>
    current?.name === name &&
    current.at.toPlainDate().equals(now.toPlainDate());

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("timetable.title")}</Card.Title>
        {shown.length === 0 ? (
          <Card.Description>{t("timetable.allHidden")}</Card.Description>
        ) : null}
      </Card.Header>
      {shown.length > 0 ? (
        <Card.Content>
          <Item.Group>
            {shown.map((name, index) => {
              const time = times[name];
              const label = t(`names.${name}`);
              const clock = time ? formatClockTime(time, timeFormat) : null;
              const past =
                time !== null &&
                !isCurrent(name) &&
                Temporal.ZonedDateTime.compare(time, now) < 0;
              return (
                <Fragment key={name}>
                  {index > 0 && <Item.Separator />}
                  <Item size="sm" className={past ? "opacity-60" : ""}>
                    <Item.Content>
                      <Item.Title>{label}</Item.Title>
                    </Item.Content>
                    <Item.Actions>
                      {isCurrent(name) ? (
                        <Badge variant="secondary">
                          {t("timetable.current")}
                        </Badge>
                      ) : null}
                      <Item.Title>
                        {clock ?? t("timetable.notReached")}
                      </Item.Title>
                      <View className="size-10 items-center justify-center">
                        {renderReminder(name, clock)}
                      </View>
                    </Item.Actions>
                  </Item>
                </Fragment>
              );
            })}
          </Item.Group>
        </Card.Content>
      ) : null}
    </Card>
  );
};
