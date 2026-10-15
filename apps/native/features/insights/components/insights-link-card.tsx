import "../i18n";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";

/** The way into Insights, for Home and the Worship tab. */
export const InsightsLinkCard = () => {
  const { t } = useTranslation("insights");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("link.title")}</Card.Title>
        <Card.Description>{t("link.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="items-start">
        <Button
          testID="insights-open"
          variant="outline"
          onPress={() => router.push("/insights")}
        >
          {t("link.open")}
        </Button>
      </Card.Content>
    </Card>
  );
};
