import "../i18n";
import { MIN_EVEN_DAYS, SUGGESTED_DAYS } from "@alrisali/domain/khatmah";
import { captureException } from "@sentry/react-native";
import { router, Stack } from "expo-router";
import { Button, Card, RadioGroup, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";
import { Screen } from "@/shared/ui/screen";

import { AmountField } from "../components/amount-field";
import { DaysField } from "../components/days-field";
import { DeadlineField } from "../components/deadline-field";
import { MeaningField } from "../components/meaning-field";
import { ReminderField } from "../components/reminder-field";
import { ScheduleField } from "../components/schedule-field";
import { useCreateKhatmah } from "../data/khatmah";
import { usePlanDraft } from "../hooks/use-plan-draft";
import type { PlanChoice } from "../hooks/use-plan-draft";
import { useDayLabels } from "../utils/use-day-labels";

const CHOICES: readonly PlanChoice[] = [
  "suggested",
  "even",
  "meaning",
  "amount",
  "deadline",
];

const isChoice = (value: string): value is PlanChoice =>
  CHOICES.some((choice) => choice === value);

/**
 * Starting a Khatmah (prototype variant A): plan cards (the suggested 30
 * days, an even split, by meaning, by amount or by deadline), how often the
 * sessions fall and where to join, what the plan commits to (amount, minutes
 * a session, finish day), and an optional reminder time.
 */
export const NewKhatmahScreen = () => {
  const { t } = useTranslation("khatmah");
  const today = useToday();
  const dayLabels = useDayLabels();
  const { mutateAsync: create, isPending, isError } = useCreateKhatmah();
  const [reminderAt, setReminderAt] = useState<number | null>(null);
  const {
    draft,
    update,
    plan,
    joinTotal,
    preview,
    deadline,
    deadlineProblem,
    earliestDeadline,
  } = usePlanDraft();

  const start = async () => {
    if (!plan) {
      return;
    }
    try {
      await create({ plan, startDate: today, reminderAt });
      router.replace("/khatmah");
    } catch (error) {
      captureException(error);
    }
  };

  const pagesPerSession = preview
    ? formatNumber(preview.pagesPerSession, { maximumFractionDigits: 1 })
    : "";

  return (
    <Screen>
      <Stack.Screen options={{ title: t("newTitle") }} />
      <Text weight="semibold">{t("plan.heading")}</Text>
      <RadioGroup
        value={draft.choice}
        onValueChange={(value) => {
          if (isChoice(value)) {
            update({ choice: value });
          }
        }}
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
                days: formatNumber(
                  draft.choice === "even" ? draft.days : MIN_EVEN_DAYS
                ),
              })}
            />
            {draft.choice === "even" ? (
              <DaysField
                value={draft.days}
                onChange={(days) => update({ days })}
              />
            ) : null}
          </Card.Content>
        </Card>
        <Card testID="khatmah-plan-meaning">
          <Card.Header>
            <Card.Title>{t("plan.meaning.title")}</Card.Title>
            <Card.Description>{t("plan.meaning.description")}</Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <RadioGroup.Item
              value="meaning"
              label={t("plan.meaning.option", {
                days: formatNumber(draft.meaning),
              })}
            />
            {draft.choice === "meaning" ? (
              <MeaningField
                days={draft.meaning}
                onChange={(meaning) => update({ meaning })}
              />
            ) : null}
          </Card.Content>
        </Card>
        <Card testID="khatmah-plan-amount">
          <Card.Header>
            <Card.Title>{t("plan.amount.title")}</Card.Title>
            <Card.Description>{t("plan.amount.description")}</Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <RadioGroup.Item
              value="amount"
              label={`${formatNumber(draft.amount.count)} ${t(`plan.amount.units.${draft.amount.unit}`)}`}
            />
            {draft.choice === "amount" ? (
              <AmountField
                unit={draft.amount.unit}
                count={draft.amount.count}
                onChange={(amount) => update({ amount })}
              />
            ) : null}
          </Card.Content>
        </Card>
        <Card testID="khatmah-plan-deadline">
          <Card.Header>
            <Card.Title>{t("plan.deadline.title")}</Card.Title>
            <Card.Description>
              {t("plan.deadline.description")}
            </Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <RadioGroup.Item
              value="deadline"
              label={t("plan.deadline.title")}
            />
            {draft.choice === "deadline" ? (
              <DeadlineField
                calendar={draft.deadlineCalendar}
                onCalendarChange={(deadlineCalendar) =>
                  update({ deadlineCalendar })
                }
                date={draft.deadlineDate}
                onDateChange={(deadlineDate) => update({ deadlineDate })}
                minDate={earliestDeadline}
                month={draft.deadlineHijri.month}
                day={draft.deadlineHijri.day}
                onHijriChange={(deadlineHijri) => update({ deadlineHijri })}
              />
            ) : null}
          </Card.Content>
        </Card>
      </RadioGroup>
      <ScheduleField
        every={draft.every}
        onEveryChange={(every) => update({ every })}
        join={draft.join}
        joinTotal={joinTotal}
        onJoinChange={(join) => update({ join })}
      />
      <Card>
        <Card.Content className="gap-1 py-3">
          {preview ? (
            <>
              <Text testID="khatmah-preview-per-day">
                {t(
                  preview.everyDays === 1
                    ? "plan.preview.perDay"
                    : "plan.preview.perSession",
                  { pages: pagesPerSession }
                )}
              </Text>
              <Text size="sm" testID="khatmah-preview-minutes">
                {t("plan.preview.minutes", {
                  minutes: formatNumber(preview.minutesPerSession),
                })}
              </Text>
              <Text size="sm" muted testID="khatmah-preview-sessions">
                {t("plan.preview.sessions", {
                  sessions: formatNumber(preview.sessions),
                })}
              </Text>
              <Text size="sm" muted testID="khatmah-preview-finish">
                {t("plan.preview.finish", dayLabels(preview.finish))}
              </Text>
            </>
          ) : null}
          {draft.choice === "deadline" ? (
            <Text
              size="sm"
              muted={deadlineProblem === null}
              className={deadlineProblem ? "text-destructive" : ""}
              testID="khatmah-deadline-result"
            >
              {deadlineProblem
                ? t(`plan.deadline.problem.${deadlineProblem}`)
                : t("plan.deadline.resolved", dayLabels(deadline))}
            </Text>
          ) : null}
        </Card.Content>
      </Card>
      <ReminderField value={reminderAt} onChange={setReminderAt} />
      {isError ? (
        <Text className="text-destructive">{t("startError")}</Text>
      ) : null}
      <Button
        testID="khatmah-start"
        disabled={isPending || plan === null}
        onPress={start}
      >
        {t("start")}
      </Button>
    </Screen>
  );
};
