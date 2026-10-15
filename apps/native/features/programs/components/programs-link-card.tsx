import "../i18n";
import { router } from "expo-router";
import { Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useSubscriptions } from "../data/subscriptions";

/** The Worship tab's way into Official Programs, with the Subscription count. */
export const ProgramsLinkCard = () => {
  const { t } = useTranslation("programs");
  const { data: subscriptions = [] } = useSubscriptions();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("link.title")}</Card.Title>
        <Card.Description>{t("link.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="items-start gap-3">
        <Text muted size="sm">
          {t("link.subscribed", { count: subscriptions.length })}
        </Text>
        <Button
          variant="outline"
          onPress={() => router.push("/worship/programs")}
        >
          {t("link.open")}
        </Button>
      </Card.Content>
    </Card>
  );
};
