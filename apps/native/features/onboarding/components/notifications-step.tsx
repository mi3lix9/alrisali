import { Button, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useAllowNotifications } from "../hooks/use-allow-notifications";

/** Offers the system prompt for the Reminders' notifications. */
export const NotificationsStep = () => {
  const { t } = useTranslation("onboarding");
  const { mutate: allow, isPending, data: outcome } = useAllowNotifications();

  if (outcome) {
    return (
      <Text muted={outcome === "declined"}>
        {t(`notifications.${outcome}`)}
      </Text>
    );
  }
  return (
    <Button variant="outline" loading={isPending} onPress={() => allow()}>
      {t("notifications.allow")}
    </Button>
  );
};
