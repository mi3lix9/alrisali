import "../i18n";
import { actsForDate } from "@alrisali/domain/programs";
import type { Act, DueAct, OfficialProgram } from "@alrisali/domain/programs";
import { router } from "expo-router";
import { Button, Card, Checkbox, Spinner, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";
import { launchLanguage } from "@/shared/lib/preferences";
import { useToday } from "@/shared/lib/today";

import {
  useActCompletionsOn,
  useSetActCompleted,
} from "../data/act-completions";
import { useOfficialPrograms } from "../data/official-programs";
import { useSubscriptions } from "../data/subscriptions";
import { ActSheet } from "./act-sheet";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

const ActRow = ({
  due: { program, act },
  done,
  canComplete,
  onToggle,
  onOpen,
}: {
  due: DueAct<OfficialProgram>;
  done: boolean;
  canComplete: boolean;
  onToggle: (completed: boolean) => void;
  onOpen: () => void;
}) => {
  const { t } = useTranslation("programs");
  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1">
        <Checkbox
          checked={done}
          disabled={!canComplete}
          onCheckedChange={onToggle}
          label={act.name[launchLanguage]}
          description={[
            program.name[launchLanguage],
            act.detail.type === "regular"
              ? null
              : t(`types.${act.detail.type}`),
          ]
            .filter((part) => part !== null)
            .join(" · ")}
        />
      </View>
      <Button
        variant="ghost"
        size="sm"
        accessibilityLabel={t("day.openLabel", {
          act: act.name[launchLanguage],
        })}
        onPress={onOpen}
      >
        {t("day.open")}
      </Button>
    </View>
  );
};

/**
 * The Worship tab's Acts for a date: from the Believer's active
 * Subscriptions, grouped before and after each Salah and then general. Any
 * date can be shown; only today and past dates can be ticked.
 */
export const ActsDayCard = () => {
  const { t } = useTranslation("programs");
  const today = useToday();
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  // null follows today, so the card moves on at midnight.
  const [picked, setPicked] = useState<Temporal.PlainDate | null>(null);
  const [opened, setOpened] = useState<Act | null>(null);
  const date = picked ?? today;
  const isToday = date.equals(today);
  const canComplete = Temporal.PlainDate.compare(date, today) <= 0;
  const hijriDate = calendar.toHijri(date);

  const programs = useOfficialPrograms();
  const subscriptions = useSubscriptions();
  const { data: completions = [] } = useActCompletionsOn(date);
  const { mutate: setCompleted, isError } = useSetActCompleted();

  const showDate = (next: Temporal.PlainDate) =>
    setPicked(next.equals(today) ? null : next);

  const day = actsForDate({
    programs: programs.data ?? [],
    subscriptions: subscriptions.data ?? [],
    date,
    hijriDate,
  });
  const isEmpty = day.bySalah.length === 0 && day.general.length === 0;

  const row = (due: DueAct<OfficialProgram>) => (
    <ActRow
      key={`${due.program.id}:${due.act.id}`}
      due={due}
      done={completions.some(
        ({ programId, actId }) =>
          programId === due.program.id && actId === due.act.id
      )}
      canComplete={canComplete}
      onToggle={(completed) =>
        setCompleted({
          programId: due.program.id,
          actId: due.act.id,
          date,
          completed,
        })
      }
      onOpen={() => setOpened(due.act)}
    />
  );

  const group = (title: string, acts: DueAct<OfficialProgram>[]) =>
    acts.length === 0 ? null : (
      <View key={title} className="gap-3">
        <Text size="sm" weight="semibold" muted accessibilityRole="header">
          {title}
        </Text>
        {acts.map(row)}
      </View>
    );

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("day.title")}</Card.Title>
        <Card.Description>{t("day.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-4">
        <View className="flex-row items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() => showDate(date.subtract({ days: 1 }))}
          >
            {t("day.previous")}
          </Button>
          <View className="flex-1 items-center">
            <Text weight="medium" className="text-center">
              {isToday
                ? t("day.today")
                : formatGregorianDate(date, DATE_FORMAT)}
            </Text>
            <Text muted size="sm" className="text-center">
              {formatHijriDate(hijriDate)}
            </Text>
          </View>
          <Button
            variant="outline"
            size="sm"
            onPress={() => showDate(date.add({ days: 1 }))}
          >
            {t("day.next")}
          </Button>
        </View>
        {programs.isPending || subscriptions.isPending ? <Spinner /> : null}
        {!programs.isPending && !subscriptions.isPending && isEmpty ? (
          <View className="items-start gap-3">
            <Text muted>
              {(subscriptions.data ?? []).length === 0
                ? t("day.noSubscriptions")
                : t("day.noneDue")}
            </Text>
            {(subscriptions.data ?? []).length === 0 ? (
              <Button
                variant="outline"
                onPress={() => router.push("/worship/programs")}
              >
                {t("link.open")}
              </Button>
            ) : null}
          </View>
        ) : null}
        {canComplete ? null : (
          <Text muted size="sm">
            {t("day.future")}
          </Text>
        )}
        {day.bySalah.flatMap(({ salah, before, after }) => [
          group(t("salah.before", { salah: t(`salahNames.${salah}`) }), before),
          group(t("salah.after", { salah: t(`salahNames.${salah}`) }), after),
        ])}
        {group(t("day.general"), day.general)}
        {isError ? (
          <Text className="text-destructive">{t("saveError")}</Text>
        ) : null}
      </Card.Content>
      {isToday ? null : (
        <Card.Footer>
          <Button variant="secondary" onPress={() => setPicked(null)}>
            {t("day.today")}
          </Button>
        </Card.Footer>
      )}
      <ActSheet act={opened} onClose={() => setOpened(null)} />
    </Card>
  );
};
