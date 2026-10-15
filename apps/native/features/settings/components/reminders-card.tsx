import { router } from "expo-router";
import { Card, Item } from "panelui-native";
import { useTranslation } from "react-i18next";

/** Opens the Reminder settings inside the Settings modal. */
export const RemindersCard = () => {
  const { t } = useTranslation("settings");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("reminders.title")}</Card.Title>
        <Card.Description>{t("reminders.description")}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Item
          size="sm"
          accessibilityRole="link"
          onPress={() => router.push("/settings/reminders")}
        >
          <Item.Content>
            <Item.Title>{t("reminders.open")}</Item.Title>
          </Item.Content>
        </Item>
      </Card.Content>
    </Card>
  );
};
