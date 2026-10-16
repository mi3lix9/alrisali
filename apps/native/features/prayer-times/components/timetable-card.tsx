import {
  calculatePrayerTimes,
  currentPrayerTime,
  locationTimeZone,
  PRAYER_TIMES,
} from "@alrisali/domain/shared";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import { Badge, Card, Item } from "panelui-native";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Temporal } from "temporal-polyfill";

import { formatGregorianDate } from "@/shared/lib/hijri-calendar";

import { useNow } from "../hooks/use-now";
import type { PrayerTimesView } from "../hooks/use-prayer-times-settings";
import { locationToday } from "../utils/day-navigation";
import { formatClockTime } from "../utils/format";

const MINUTE_MS = 60_000;

/**
 * The visible Prayer Times of `date` (today when omitted) on the location's
 * clock, with the one in progress marked on today only. `rowActions` (another feature's control, from the route)
 * ends each row.
 */
export const TimetableCard = ({
  view,
  date,
  rowActions,
}: {
  view: PrayerTimesView & {
    settings: NonNullable<PrayerTimesView["settings"]>;
  };
  date?: Temporal.PlainDate | undefined;
  rowActions?: ((name: PrayerTimeName) => ReactNode) | undefined;
}) => {
  const { t } = useTranslation("prayer-times");
  const now = useNow(MINUTE_MS);
  const { settings, hidden, timeFormat } = view;
  const timeZone = locationTimeZone(settings.coordinates);
  const today = locationToday(now, timeZone);
  const day = date ?? today;
  const isToday = day.equals(today);
  const times = calculatePrayerTimes(day, timeZone, settings);
  const current = currentPrayerTime(now, settings, hidden);
  const shown = PRAYER_TIMES.filter((name) => !hidden.includes(name));
  const isCurrent = (name: PrayerTimeName) =>
    isToday && current?.name === name && current.at.toPlainDate().equals(day);

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          {isToday
            ? t("timetable.title")
            : t("day.timetableTitle", { date: formatGregorianDate(day) })}
        </Card.Title>
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
              return (
                <Fragment key={name}>
                  {index > 0 && <Item.Separator />}
                  <Item
                    size="sm"
                    accessible
                    {...(time
                      ? {}
                      : {
                          accessibilityLabel: t("timetable.notReachedLabel", {
                            name: label,
                          }),
                        })}
                  >
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
                        {time
                          ? formatClockTime(time, timeFormat)
                          : t("timetable.notReached")}
                      </Item.Title>
                      {rowActions?.(name)}
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
