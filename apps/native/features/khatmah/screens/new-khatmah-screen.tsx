import "../i18n";
import { PAGE_COUNT } from "@alrisali/content/quran";
import {
  MIN_EVEN_DAYS,
  planDays,
  SUGGESTED_DAYS,
} from "@alrisali/domain/khatmah";
import type { KhatmahPlan } from "@alrisali/domain/khatmah";
import { captureException } from "@sentry/react-native";
import { router, Stack } from "expo-router";
import { Button, Card, RadioGroup, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";
import { Screen } from "@/shared/ui/screen";

import { DaysField } from "../components/days-field";
import { ReminderField } from "../components/reminder-field";
import { useCreateKhatmah } from "../data/khatmah";
import { useDayLabels } from "../utils/use-day-labels";

type PlanChoice = "suggested" | "even";

/**
 * Starting a Khatmah (prototype variant A): plan cards (the suggested 30
 * days, or an even split of 3 to 240 days), what the plan commits to, and an
 * optional daily reminder time.
 */
export const NewKhatmahScreen = () => {
  const { t } = useTranslation("khatmah");
  const today = useToday();
  const dayLabels = useDayLabels();
  const { mutateAsync: create, isPending, isError } = useCreateKhatmah();
  const [choice, setChoice] = useState<PlanChoice>("suggested");
  const [days, setDays] = useState(60);
  const [reminderAt, setReminderAt] = useState<number | null>(null);

  const plan: KhatmahPlan =
    choice === "suggested" ? { kind: "suggested" } : { kind: "even", days };
  const total = planDays(plan);
  const finish = dayLabels(today.add({ days: total - 1 }));
  const perDay = formatNumber(PAGE_COUNT / total, { maximumFractionDigits: 1 });

  const start = async () => {
    try {
      await create({
        plan,
        startDate: today,
        reminderAt,
      });
      router.replace("/khatmah");
    } catch (error) {
      captureException(error);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t("newTitle") }} />
      <Text weight="semibold">{t("plan.heading")}</Text>
      <RadioGroup
        value={choice}
        onValueChange={(value) =>
          setChoice(value === "even" ? "even" : "suggested")
        }
        accessibilityLabel={t("plan.select")}
      >
        <Card testID="khatmah-plan-suggested">
          <Card.Header>
            <Card.Title>{t("plan.suggested.title")}</Card.Title>
            <Card.Description>
              {t("plan.suggested.description")}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <RadioGroup.Item
              value="suggested"
              label={t("plan.daysValue", {
                days: formatNumber(SUGGESTED_DAYS),
              })}
            />
          </Card.Content>
        </Card>
        <Card testID="khatmah-plan-even">
          <Card.Header>
            <Card.Title>{t("plan.even.title")}</Card.Title>
            <Card.Description>{t("plan.even.description")}</Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <RadioGroup.Item
              value="even"
              label={t("plan.daysValue", {
                days: formatNumber(choice === "even" ? days : MIN_EVEN_DAYS),
              })}
            />
            {choice === "even" ? (
              <DaysField value={days} onChange={setDays} />
            ) : null}
          </Card.Content>
        </Card>
      </RadioGroup>
      <Card>
        <Card.Content className="gap-1 py-3">
          <Text testID="khatmah-preview-per-day">
            {t("plan.preview.perDay", { pages: perDay })}
          </Text>
          <Text size="sm" muted testID="khatmah-preview-finish">
            {t("plan.preview.finish", finish)}
          </Text>
        </Card.Content>
      </Card>
      <ReminderField value={reminderAt} onChange={setReminderAt} />
      {isError ? (
        <Text className="text-destructive">{t("startError")}</Text>
      ) : null}
      <Button testID="khatmah-start" disabled={isPending} onPress={start}>
        {t("start")}
      </Button>
    </Screen>
  );
};
