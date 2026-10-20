import "../i18n";
import { khatmahSessionRows } from "@alrisali/domain/khatmah";
import { captureException } from "@sentry/react-native";
import { router } from "expo-router";
import { Button, Card, toast } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";

import { useCreateKhatmah } from "../data/khatmah";
import type { ActiveKhatmah } from "../hooks/use-active-khatmah";
import { SessionChart } from "./session-chart";

/** The Sahifa's dua on completing a reading of the Quran. */
export const COMPLETION_DUA_ID = "sahifa-42";

/**
 * A finished Khatmah: the celebration, the dua after completing the Quran,
 * the same plan again or a new one, and the chart of its sessions.
 */
export const CelebrationCard = ({ active }: { active: ActiveKhatmah }) => {
  const { t } = useTranslation("khatmahProgress");
  const today = useToday();
  const { mutateAsync: create, isPending } = useCreateKhatmah();
  const { khatmah, logs } = active;

  const finishedOn = logs
    .filter(({ khatmahId }) => khatmahId === khatmah.id)
    .map(({ date }) => date)
    .toSorted(Temporal.PlainDate.compare)
    .at(-1);
  const days = finishedOn
    ? khatmah.startDate.until(finishedOn, { largestUnit: "days" }).days + 1
    : 0;

  const repeat = async () => {
    // The same plan from its first session, not from where it was joined.
    const { from: _joinedAt, ...whole } = khatmah.plan;
    try {
      await create({
        plan: whole,
        startDate: today,
        reminderAt: khatmah.reminderAt,
      });
      router.replace("/khatmah");
    } catch (error) {
      captureException(error);
      toast.show({ variant: "warning", label: t("celebration.repeatError") });
    }
  };

  return (
    <Card testID="khatmah-celebration">
      <Card.Header>
        <Card.Title>{t("celebration.title")}</Card.Title>
        <Card.Description>
          {t("celebration.description", {
            days: formatNumber(Math.max(days, 1)),
          })}
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-3">
        <SessionChart rows={khatmahSessionRows(khatmah, logs, today)} />
      </Card.Content>
      <Card.Footer className="flex-col gap-2">
        <Button
          testID="khatmah-completion-dua"
          onPress={() =>
            router.push({
              pathname: "/library/supplication/[id]",
              params: { id: COMPLETION_DUA_ID },
            })
          }
        >
          {t("celebration.dua")}
        </Button>
        <Button
          testID="khatmah-repeat"
          variant="secondary"
          disabled={isPending}
          onPress={repeat}
        >
          {t("celebration.repeat")}
        </Button>
        <Button
          testID="khatmah-start-new"
          variant="outline"
          onPress={() => router.push("/khatmah-new")}
        >
          {t("celebration.startNew")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
