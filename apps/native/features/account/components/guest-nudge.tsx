import { router } from "expo-router";
import { Alert, Button } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import "../i18n";
import { useGuestNudge } from "../hooks/use-guest-nudge";

interface GuestNudgeProps {
  /** Offers the account screen, when shown away from the sign-in card. */
  showSignIn?: boolean;
}

/**
 * Tells a Guest how many records are only on this device, once they have
 * made enough since the last dismissal; nothing otherwise.
 */
export const GuestNudge = ({ showSignIn = false }: GuestNudgeProps) => {
  const { t } = useTranslation("account");
  const nudge = useGuestNudge();

  if (!nudge.shown) {
    return null;
  }

  return (
    <Alert variant="warning" testID="account-guest-nudge">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("nudge.title")}</Alert.Title>
        <Alert.Description>
          {t("nudge.message", {
            records: t("nudge.records", { count: nudge.records }),
          })}
        </Alert.Description>
        <View className="flex-row flex-wrap gap-2 pt-2">
          {showSignIn ? (
            <Button size="sm" onPress={() => router.push("/account")}>
              {t("nudge.signIn")}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            testID="account-guest-nudge-dismiss"
            onPress={() => nudge.dismiss()}
          >
            {t("nudge.dismiss")}
          </Button>
        </View>
      </Alert.Content>
    </Alert>
  );
};
