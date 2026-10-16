import { Button, Text } from "panelui-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useAllowNotifications } from "../hooks/use-allow-notifications";

/**
 * Shows the alert choices (a preview of a prayer notification first), then
 * offers the system prompt for the Reminders' notifications: the prompt comes
 * only from the button, after the Believer has seen what it is for.
 */
export const NotificationsStep = ({ alerts }: { alerts: ReactNode }) => {
  const { t } = useTranslation("onboarding");
  const { mutate: allow, isPending, data: outcome } = useAllowNotifications();

  return (
    <View className="gap-4">
      {alerts}
      {outcome ? (
        <Text muted={outcome === "declined"}>
          {t(`notifications.${outcome}`)}
        </Text>
      ) : (
        <>
          <Text muted size="xs">
            {t("notifications.reason")}
          </Text>
          <Button
            variant="outline"
            testID="onboarding-allow-notifications"
            loading={isPending}
            onPress={() => allow()}
          >
            {t("notifications.allow")}
          </Button>
        </>
      )}
    </View>
  );
};
