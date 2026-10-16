import "../i18n";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";

/** Opens the Prayer Assistant from the Prayer tab. */
export const PrayerAssistantCard = () => {
  const { t } = useTranslation("prayer-assistant");
  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
        <Card.Description>{t("card.description")}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button onPress={() => router.push("/prayer-assistant")}>
          {t("card.start")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
