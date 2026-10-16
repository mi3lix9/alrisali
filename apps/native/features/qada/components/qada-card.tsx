import "../i18n";
import { qadaToday, remainingBacklog, totalSalah } from "@alrisali/domain/qada";
import { router } from "expo-router";
import { Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";

import { useQadaData } from "../data/qada";

/**
 * The Prayer tab's Qada card: what is left and today's plan, one tap into
 * the Qada dashboard; before setup, an invitation to set a plan up.
 */
export const QadaCard = () => {
  const { t } = useTranslation("qada");
  const today = useToday();
  const { data } = useQadaData();

  if (!data) {
    return null;
  }

  if (!data.plan) {
    return (
      <Card testID="qada-card">
        <Card.Header>
          <Card.Title>{t("card.title")}</Card.Title>
          <Card.Description>{t("card.setUpDescription")}</Card.Description>
        </Card.Header>
        <Card.Footer>
          <Button
            testID="qada-set-up"
            variant="secondary"
            onPress={() => router.push("/qada-setup")}
          >
            {t("card.setUp")}
          </Button>
        </Card.Footer>
      </Card>
    );
  }

  const { plan, logs } = data;
  const remaining = remainingBacklog(plan.backlog, logs);
  const left = totalSalah(remaining);
  const items = qadaToday(plan.backlog, plan.pace, logs, today);
  const done = items.filter((item) => item.logged).length;

  return (
    <Card testID="qada-card">
      <Card.Header>
        <Card.Title>{t("card.title")}</Card.Title>
        <Card.Description>
          {left === 0 && remaining.fasts === 0
            ? t("card.done")
            : t("card.remaining", { n: formatNumber(left) })}
        </Card.Description>
      </Card.Header>
      {items.length > 0 ? (
        <Card.Content>
          <Text>
            {t("card.today", {
              done: formatNumber(done),
              total: formatNumber(items.length),
            })}
          </Text>
        </Card.Content>
      ) : null}
      <Card.Footer>
        <Button
          testID="qada-open"
          variant="secondary"
          onPress={() => router.push("/qada")}
        >
          {t("card.open")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
