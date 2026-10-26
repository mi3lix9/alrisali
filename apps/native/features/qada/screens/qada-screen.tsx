import "../i18n";
import {
  qadaDaysLeft,
  qadaItemLog,
  qadaToday,
  remainingBacklog,
  totalSalah,
} from "@alrisali/domain/qada";
import type { QadaItem, QadaPlan } from "@alrisali/domain/qada";
import { SALAH } from "@alrisali/domain/shared";
import type { Weekday } from "@alrisali/domain/shared";
import { router, Stack } from "expo-router";
import type { TFunction } from "i18next";
import { Card, Checkbox, Item, Spinner, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { formatDateTime, formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";
import { HeaderButton } from "@/shared/ui/header-button";
import { Screen } from "@/shared/ui/screen";

import { QadaCalendar } from "../components/qada-calendar";
import { useChangeQadaLog, useQadaData } from "../data/qada";
import type { QadaData } from "../data/qada";

// Saturday first, as the week runs where the app is mostly used.
const WEEKDAYS: readonly Weekday[] = [6, 7, 1, 2, 3, 4, 5];
const MINUTES_PER_HOUR = 60;

const StatTile = ({
  label,
  value,
  unit,
  testID,
}: {
  label: string;
  value: number;
  unit: string;
  testID: string;
}) => (
  <Card className="min-w-24 flex-1">
    <Card.Content className="gap-1 py-3">
      <Text size="sm" muted>
        {label}
      </Text>
      <Text size="xl" weight="bold" testID={testID}>
        {formatNumber(value)}
      </Text>
      <Text size="xs" muted>
        {unit}
      </Text>
    </Card.Content>
  </Card>
);

const reminderSummary = (plan: QadaPlan, t: TFunction<"qada">): string => {
  const { reminder } = plan;
  if (!reminder.enabled || reminder.weekdays.length === 0) {
    return t("dashboard.reminderOff");
  }
  const time = formatDateTime(
    new Temporal.PlainTime(
      Math.floor(reminder.at / MINUTES_PER_HOUR),
      reminder.at % MINUTES_PER_HOUR
    ),
    { hour: "numeric", minute: "2-digit" }
  );
  if (reminder.weekdays.length === WEEKDAYS.length) {
    return t("dashboard.reminderDaily", { time });
  }
  const days = WEEKDAYS.filter((weekday) => reminder.weekdays.includes(weekday))
    .map((weekday) => t(`weekday.${weekday}`))
    .join(t("dashboard.daySeparator"));
  return t("dashboard.reminderDays", { time, days });
};

const Dashboard = ({ data, plan }: { data: QadaData; plan: QadaPlan }) => {
  const { t } = useTranslation("qada");
  const today = useToday();
  const { mutate: change, isError } = useChangeQadaLog();
  const { logs } = data;
  const remaining = remainingBacklog(plan.backlog, logs);
  const left = totalSalah(remaining);
  const total = totalSalah(plan.backlog);
  const percent = total === 0 ? 1 : (total - left) / total;
  const daysLeft = qadaDaysLeft(remaining, plan.pace);
  const items = qadaToday(plan.backlog, plan.pace, logs, today);
  const done = items.filter((item) => item.logged).length;

  const toggle = (item: QadaItem) => {
    if (!item.logged) {
      change({ log: qadaItemLog(item, today), logged: true });
      return;
    }
    // An item's Qada Log carries its id, so un-ticking gives back that one.
    change({ log: qadaItemLog(item, today), logged: false });
  };

  return (
    <Screen>
      <Card>
        <Card.Content className="gap-1 py-4">
          <Text muted>{t("dashboard.left")}</Text>
          <View className="flex-row items-end justify-between gap-2">
            <Text size="3xl" weight="bold" testID="qada-remaining-total">
              {formatNumber(left)}
            </Text>
            <Text muted>
              {t("dashboard.percentDone", {
                percent: formatNumber(percent, {
                  style: "percent",
                  maximumFractionDigits: 0,
                }),
              })}
            </Text>
          </View>
          <Text size="sm" muted>
            {daysLeft === 0
              ? t("dashboard.allDone")
              : t("dashboard.finish", {
                  pace: formatNumber(plan.pace.salahPerDay),
                  date: formatDateTime(today.add({ days: daysLeft - 1 }), {
                    month: "long",
                    year: "numeric",
                  }),
                })}
          </Text>
        </Card.Content>
      </Card>
      <View className="flex-row flex-wrap gap-2">
        {SALAH.map((salah) => (
          <StatTile
            key={salah}
            testID={`qada-remaining-${salah}`}
            label={t(`salah.${salah}`)}
            value={remaining.salah[salah]}
            unit={t("unit.salah")}
          />
        ))}
        <StatTile
          testID="qada-remaining-fasts"
          label={t("fasts")}
          value={remaining.fasts}
          unit={t("unit.day")}
        />
      </View>
      <Card>
        <Card.Header>
          <Card.Title>
            {t("dashboard.today", {
              done: formatNumber(done),
              total: formatNumber(items.length),
            })}
          </Card.Title>
        </Card.Header>
        <Card.Content className="gap-3">
          {items.length === 0 ? (
            <Text muted>{t("dashboard.nothingToday")}</Text>
          ) : null}
          {items.map((item) => (
            <View key={item.id} className="min-h-9 justify-center gap-1">
              <Checkbox
                checked={item.logged}
                onCheckedChange={() => toggle(item)}
                label={
                  item.kind === "fast"
                    ? t("item.fast")
                    : t("item.salah", { name: t(`salah.${item.salah}`) })
                }
              />
              <Text size="sm" muted>
                {item.logged ? t("item.logged") : t("item.notYet")}
              </Text>
            </View>
          ))}
          {isError ? (
            <Text className="text-destructive">{t("dashboard.saveError")}</Text>
          ) : null}
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>{t("dashboard.calendar")}</Card.Title>
        </Card.Header>
        <Card.Content>
          <QadaCalendar logs={logs} today={today} />
        </Card.Content>
      </Card>
      <Card>
        <Item size="sm" onPress={() => router.push("/qada-setup")}>
          <Item.Content>
            <Item.Title>{t("dashboard.reminder")}</Item.Title>
            <Item.Description>{reminderSummary(plan, t)}</Item.Description>
          </Item.Content>
        </Item>
        <Item size="sm" onPress={() => router.push("/prayer")}>
          <Item.Content>
            <Item.Title>{t("dashboard.prayerLog")}</Item.Title>
            <Item.Description>{t("dashboard.prayerLogHint")}</Item.Description>
          </Item.Content>
        </Item>
        <Item size="sm" onPress={() => router.push("/qada-setup")}>
          <Item.Content>
            <Item.Title>{t("fasts")}</Item.Title>
            <Item.Description>
              {t("dashboard.fastsLeft", {
                n: formatNumber(remaining.fasts),
                pace: formatNumber(plan.pace.fastsPerWeek),
              })}
            </Item.Description>
          </Item.Content>
        </Item>
      </Card>
      <Text size="xs" muted>
        {t("dashboard.privacy")}
      </Text>
    </Screen>
  );
};

/**
 * The Qada dashboard (prototype variant A): what is left, per Salah and
 * fasts, today's items to tick, the last five weeks, and the reminder. Opens
 * the setup when no plan exists yet.
 */
export const QadaScreen = () => {
  const { t } = useTranslation("qada");
  const { data } = useQadaData();

  return (
    <>
      <Stack.Screen options={{ title: t("title") }} />
      <HeaderButton
        placement="right"
        label={t("dashboard.edit")}
        symbol="pencil"
        onPress={() => router.push("/qada-setup")}
      />
      {data?.plan ? (
        <Dashboard data={data} plan={data.plan} />
      ) : (
        <View className="bg-background flex-1 items-center justify-center">
          {data ? null : <Spinner />}
        </View>
      )}
    </>
  );
};
