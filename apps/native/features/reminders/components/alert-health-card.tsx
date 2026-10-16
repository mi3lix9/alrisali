import "../i18n";
import { router } from "expo-router";
import { Badge, Card, Item } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useAlertHealth } from "../hooks/use-alert-health";

/** Settings' entry to Alert Health, with a dot only while a check fails. */
export const AlertHealthCard = () => {
  const { t } = useTranslation("reminders");
  const { problems } = useAlertHealth();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("health.title")}</Card.Title>
        <Card.Description>{t("health.description")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Item
          size="sm"
          accessibilityRole="link"
          testID="alert-health-open"
          onPress={() => router.push("/settings/alert-health")}
        >
          <Item.Content>
            <Item.Title>{t("health.open")}</Item.Title>
          </Item.Content>
          {problems.length > 0 ? (
            <Item.Actions>
              <Badge
                size="sm"
                variant="destructive"
                testID="alert-health-dot"
                accessibilityLabel={t("health.needsAttention")}
              >
                {String(problems.length)}
              </Badge>
            </Item.Actions>
          ) : null}
        </Item>
      </Card.Content>
    </Card>
  );
};
