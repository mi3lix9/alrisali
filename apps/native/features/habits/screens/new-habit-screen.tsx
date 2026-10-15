import "../i18n";
import { habitNameSchema } from "@alrisali/domain/habits";
import type { HabitSchedule, Weekday } from "@alrisali/domain/shared";
import { captureException } from "@sentry/react-native";
import { router, Stack } from "expo-router";
import {
  Button,
  DatePicker,
  Input,
  Item,
  Switch,
  Text,
  TimePicker,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { launchLanguage } from "@/shared/lib/preferences";
import { useToday } from "@/shared/lib/today";
import { Screen } from "@/shared/ui/screen";

import { useCreateHabit } from "../data/habits";

const KINDS = ["daily", "weekdays", "once"] as const;
type Kind = (typeof KINDS)[number];

// Saturday first, as the week runs where the app is mostly used.
const WEEKDAYS: readonly Weekday[] = [6, 7, 1, 2, 3, 4, 5];

const MINUTES_PER_HOUR = 60;
const DEFAULT_REMINDER_AT = 8 * MINUTES_PER_HOUR;

type FormError = "name" | "days" | "failed" | null;

const toDate = (date: Temporal.PlainDate): Date =>
  new Date(date.year, date.month - 1, date.day);

const fromDate = (date: Date): Temporal.PlainDate =>
  Temporal.PlainDate.from({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

/** Creates a Habit: name, how it repeats, and an optional Reminder. */
export const NewHabitScreen = () => {
  const { t } = useTranslation("habits");
  const today = useToday();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("daily");
  const [weekdays, setWeekdays] = useState<readonly Weekday[]>([]);
  // null follows today until the Believer picks a date.
  const [pickedDate, setPickedDate] = useState<Temporal.PlainDate | null>(null);
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderAt, setReminderAt] = useState(DEFAULT_REMINDER_AT);
  const [problem, setProblem] = useState<FormError>(null);
  const { mutateAsync: create, isPending } = useCreateHabit();
  const date = pickedDate ?? today;

  const submit = async () => {
    if (!habitNameSchema.safeParse(name).success) {
      setProblem("name");
      return;
    }
    if (kind === "weekdays" && weekdays.length === 0) {
      setProblem("days");
      return;
    }
    let schedule: HabitSchedule = { kind: "daily" };
    if (kind === "weekdays") {
      schedule = { kind, weekdays };
    } else if (kind === "once") {
      schedule = { kind, date };
    }
    setProblem(null);
    try {
      await create({
        name,
        schedule,
        reminderAt: reminderOn ? reminderAt : null,
      });
      router.back();
    } catch (error) {
      captureException(error);
      setProblem("failed");
    }
  };

  return (
    <Screen>
      <Stack.Screen
        options={{ title: t("form.title"), headerLargeTitle: false }}
      />
      <Input
        label={t("form.name")}
        placeholder={t("form.namePlaceholder")}
        value={name}
        onChangeText={setName}
        autoComplete="off"
        isRequired
        {...(problem === "name" ? { errorMessage: t("form.invalidName") } : {})}
      />
      <View className="gap-2">
        <Text weight="medium">{t("form.repeat")}</Text>
        <ToggleButtonGroup
          selectionMode="single"
          size="sm"
          accessibilityLabel={t("form.repeat")}
          value={[kind]}
          onValueChange={([next]) => {
            const selected = KINDS.find((option) => option === next);
            if (selected) {
              setKind(selected);
            }
          }}
        >
          {KINDS.map((option) => (
            <ToggleButton key={option} id={option}>
              {t(`schedule.${option}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </View>
      {kind === "weekdays" ? (
        <View className="gap-2">
          <Text weight="medium">{t("form.days")}</Text>
          <ToggleButtonGroup
            selectionMode="multiple"
            size="sm"
            className="flex-wrap"
            accessibilityLabel={t("form.days")}
            value={weekdays.map(String)}
            onValueChange={(next) =>
              setWeekdays(
                WEEKDAYS.filter((weekday) => next.includes(String(weekday)))
              )
            }
          >
            {WEEKDAYS.map((weekday) => (
              <ToggleButton key={weekday} id={String(weekday)}>
                {t(`weekday.${weekday}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {problem === "days" ? (
            <Text className="text-destructive">{t("form.invalidDays")}</Text>
          ) : null}
        </View>
      ) : null}
      {kind === "once" ? (
        <View className="gap-2">
          <Text weight="medium">{t("form.date")}</Text>
          <DatePicker
            selected={toDate(date)}
            onSelect={(selected) => {
              if (selected) {
                setPickedDate(fromDate(selected));
              }
            }}
            minDate={toDate(today)}
            locale={launchLanguage}
          />
        </View>
      ) : null}
      <Item size="sm">
        <Item.Content>
          <Item.Title>{t("form.reminder")}</Item.Title>
          <Item.Description>{t("form.reminderDescription")}</Item.Description>
        </Item.Content>
        <Item.Actions>
          <Switch
            label={t("form.reminder")}
            value={reminderOn}
            onValueChange={setReminderOn}
          />
        </Item.Actions>
      </Item>
      {reminderOn ? (
        <View className="gap-2">
          <Text weight="medium">{t("form.reminderTime")}</Text>
          <TimePicker
            value={{
              hour: Math.floor(reminderAt / MINUTES_PER_HOUR),
              minute: reminderAt % MINUTES_PER_HOUR,
            }}
            locale={launchLanguage}
            onValueChange={({ hour, minute }) =>
              setReminderAt(hour * MINUTES_PER_HOUR + minute)
            }
          />
        </View>
      ) : null}
      {problem === "failed" ? (
        <Text className="text-destructive" accessibilityLiveRegion="polite">
          {t("form.failed")}
        </Text>
      ) : null}
      <Button onPress={submit} disabled={isPending}>
        {t("form.create")}
      </Button>
    </Screen>
  );
};
