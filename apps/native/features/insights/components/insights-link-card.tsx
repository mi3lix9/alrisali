import "../i18n";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";

import { WidgetTile } from "@/shared/ui/widget";

const openInsights = () => router.push("/insights");

/**
 * The way into Insights, for Home and the Worship tab. `compact` is Home's
 * half-width tile.
 */
export const InsightsLinkCard = ({
  compact = false,
}: {
  compact?: boolean;
}) => {
  const { t } = useTranslation("insights");

  if (compact) {
    return (
      <WidgetTile
        testID="insights-open"
        label={t("link.title")}
        value={t("link.open")}
        caption={t("link.description")}
        onPress={openInsights}
      />
    );
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("link.title")}</Card.Title>
        <Card.Description>{t("link.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="items-start">
        <Button testID="insights-open" variant="outline" onPress={openInsights}>
          {t("link.open")}
        </Button>
      </Card.Content>
    </Card>
  );
};
