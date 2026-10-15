import "../i18n";
import { router } from "expo-router";
import { Card, Item } from "panelui-native";
import { useTranslation } from "react-i18next";

/** Opens the Announcements inbox and opt-out inside the Settings modal. */
export const AnnouncementsCard = () => {
  const { t } = useTranslation("announcements");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
        <Card.Description>{t("card.description")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Item
          size="sm"
          accessibilityRole="link"
          onPress={() => router.push("/settings/announcements")}
        >
          <Item.Content>
            <Item.Title>{t("card.open")}</Item.Title>
          </Item.Content>
        </Item>
      </Card.Content>
    </Card>
  );
};
