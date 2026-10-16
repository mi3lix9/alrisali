import "../i18n";
import {
  DEFAULT_QADA_PACE,
  DEFAULT_QADA_REMINDER,
  EMPTY_QADA_BACKLOG,
  matchingPreset,
  MAX_FASTS_PER_WEEK,
  MAX_QADA_COUNT,
  MAX_SALAH_PER_DAY,
  presetSalahBacklog,
  QADA_PRESETS,
  qadaDaysLeft,
  totalSalah,
} from "@alrisali/domain/qada";
import type { QadaPlan } from "@alrisali/domain/qada";
import { SALAH } from "@alrisali/domain/shared";
import type { Weekday } from "@alrisali/domain/shared";
import { captureException } from "@sentry/react-native";
import { router, Stack } from "expo-router";
import {
  Button,
  Card,
  Item,
  Spinner,
  Switch,
  Text,
  TimePicker,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import { CountField } from "../components/count-field";
import { useQadaData, useSaveQadaPlan } from "../data/qada";

// Saturday first, as the week runs where the app is mostly used.
const WEEKDAYS: readonly Weekday[] = [6, 7, 1, 2, 3, 4, 5];
const MINUTES_PER_HOUR = 60;
/** Each − or + on a Salah count. */
const SALAH_STEP = 10;
/** The days in a month, as the presets count them. */
const MONTH_DAYS = 30;

const NEW_PLAN: QadaPlan = {
  backlog: EMPTY_QADA_BACKLOG,
  pace: DEFAULT_QADA_PACE,
  reminder: DEFAULT_QADA_REMINDER,
};

type FormError = "days" | "failed" | null;

const QadaSetupForm = ({ initial }: { initial: QadaPlan }) => {
  const { t } = useTranslation("qada");
  const [plan, setPlan] = useState(initial);
  const [problem, setProblem] = useState<FormError>(null);
  const { mutateAsync: save, isPending } = useSaveQadaPlan();
  const { backlog, pace, reminder } = plan;
  const preset = matchingPreset(backlog.salah);
  const days = qadaDaysLeft(backlog, pace);

  const submit = async () => {
    if (reminder.enabled && reminder.weekdays.length === 0) {
      setProblem("days");
      return;
    }
    setProblem(null);
    try {
      await save(plan);
      router.back();
    } catch (error) {
      captureException(error);
      setProblem("failed");
    }
  };

  return (
    <Screen>
      <Text muted>{t("setup.intro")}</Text>
      <Card>
        <Card.Header>
          <Card.Title>{t("setup.missedSalah")}</Card.Title>
          <Card.Description>
            {t("setup.presetHint", { n: formatNumber(MONTH_DAYS) })}
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-4">
          <ToggleButtonGroup
            selectionMode="single"
            size="sm"
            className="flex-wrap"
            accessibilityLabel={t("setup.missedSalah")}
            value={preset ? [preset.id] : []}
            onValueChange={([next]) => {
              const picked = QADA_PRESETS.find(({ id }) => id === next);
              if (picked) {
                setPlan({
                  ...plan,
                  backlog: { ...backlog, salah: presetSalahBacklog(picked) },
                });
              }
            }}
          >
            {QADA_PRESETS.map((option) => (
              <ToggleButton
                key={option.id}
                id={option.id}
                testID={`qada-preset-${option.id}`}
              >
                {t(`setup.preset.${option.id}`, {
                  // Days under a month, else months: "10 days", "6 months".
                  n: formatNumber(
                    option.days < MONTH_DAYS
                      ? option.days
                      : option.days / MONTH_DAYS
                  ),
                })}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {SALAH.map((salah) => (
            <CountField
              key={salah}
              testID={`qada-count-${salah}`}
              label={t(`salah.${salah}`)}
              value={backlog.salah[salah]}
              step={SALAH_STEP}
              min={0}
              max={MAX_QADA_COUNT}
              onChange={(value) =>
                setPlan({
                  ...plan,
                  backlog: {
                    ...backlog,
                    salah: { ...backlog.salah, [salah]: value },
                  },
                })
              }
            />
          ))}
          <View className="flex-row justify-between">
            <Text weight="medium">{t("setup.total")}</Text>
            <Text weight="semibold">{formatNumber(totalSalah(backlog))}</Text>
          </View>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>{t("setup.missedFasts")}</Card.Title>
        </Card.Header>
        <Card.Content>
          <CountField
            testID="qada-count-fasts"
            label={t("setup.fastDays")}
            value={backlog.fasts}
            step={1}
            min={0}
            max={MAX_QADA_COUNT}
            onChange={(fasts) =>
              setPlan({ ...plan, backlog: { ...backlog, fasts } })
            }
          />
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <Card.Title>{t("setup.pace")}</Card.Title>
        </Card.Header>
        <Card.Content className="gap-4">
          <CountField
            testID="qada-pace-salah"
            label={t("setup.salahPerDay")}
            value={pace.salahPerDay}
            step={1}
            min={1}
            max={MAX_SALAH_PER_DAY}
            onChange={(salahPerDay) =>
              setPlan({ ...plan, pace: { ...pace, salahPerDay } })
            }
          />
          <CountField
            testID="qada-pace-fasts"
            label={t("setup.fastsPerWeek")}
            value={pace.fastsPerWeek}
            step={1}
            min={0}
            max={MAX_FASTS_PER_WEEK}
            onChange={(fastsPerWeek) =>
              setPlan({ ...plan, pace: { ...pace, fastsPerWeek } })
            }
          />
          {days > 0 ? (
            <Text muted>
              {t("setup.projection", { days: formatNumber(days) })}
            </Text>
          ) : null}
        </Card.Content>
      </Card>
      <Item size="sm">
        <Item.Content>
          <Item.Title>{t("setup.reminder")}</Item.Title>
          <Item.Description>{t("setup.reminderDescription")}</Item.Description>
        </Item.Content>
        <Item.Actions>
          <Switch
            label={t("setup.reminder")}
            value={reminder.enabled}
            onValueChange={(enabled) =>
              setPlan({ ...plan, reminder: { ...reminder, enabled } })
            }
          />
        </Item.Actions>
      </Item>
      {reminder.enabled ? (
        <>
          <View className="gap-2">
            <Text weight="medium">{t("setup.reminderTime")}</Text>
            <TimePicker
              value={{
                hour: Math.floor(reminder.at / MINUTES_PER_HOUR),
                minute: reminder.at % MINUTES_PER_HOUR,
              }}
              locale={launchLanguage}
              onValueChange={({ hour, minute }) =>
                setPlan({
                  ...plan,
                  reminder: {
                    ...reminder,
                    at: hour * MINUTES_PER_HOUR + minute,
                  },
                })
              }
            />
          </View>
          <View className="gap-2">
            <Text weight="medium">{t("setup.reminderDays")}</Text>
            <ToggleButtonGroup
              selectionMode="multiple"
              size="sm"
              className="flex-wrap"
              accessibilityLabel={t("setup.reminderDays")}
              value={reminder.weekdays.map(String)}
              onValueChange={(next) =>
                setPlan({
                  ...plan,
                  reminder: {
                    ...reminder,
                    weekdays: WEEKDAYS.filter((weekday) =>
                      next.includes(String(weekday))
                    ),
                  },
                })
              }
            >
              {WEEKDAYS.map((weekday) => (
                <ToggleButton key={weekday} id={String(weekday)}>
                  {t(`weekday.${weekday}`)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {problem === "days" ? (
              <Text className="text-destructive">{t("setup.noDays")}</Text>
            ) : null}
          </View>
        </>
      ) : null}
      {problem === "failed" ? (
        <Text className="text-destructive" accessibilityLiveRegion="polite">
          {t("setup.failed")}
        </Text>
      ) : null}
      <Button testID="qada-save" onPress={submit} disabled={isPending}>
        {t("setup.save")}
      </Button>
    </Screen>
  );
};

/**
 * Sets up or edits the Qada Plan: missed Salah per prayer (a preset period
 * or exact counts), missed fasts, the pace and the Qada Reminder.
 */
export const QadaSetupScreen = () => {
  const { t } = useTranslation("qada");
  const { data } = useQadaData();

  return (
    <>
      <Stack.Screen
        options={{ title: t("setupTitle"), headerLargeTitle: false }}
      />
      {data ? (
        <QadaSetupForm initial={data.plan ?? NEW_PLAN} />
      ) : (
        <View className="bg-background flex-1 items-center justify-center">
          <Spinner />
        </View>
      )}
    </>
  );
};
