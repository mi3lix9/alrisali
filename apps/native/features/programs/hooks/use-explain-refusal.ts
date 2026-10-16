import "../i18n";
import { SubscriptionRefusedError } from "@alrisali/domain/programs";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Alert } from "react-native";

/**
 * Explains a refused Subscription in a dialog (also announced): which rule
 * or limit stopped it and what to do. Other errors are left to the caller.
 */
export const useExplainRefusal = () => {
  const { t } = useTranslation("programs");
  return useCallback(
    (error: unknown, onDismiss?: () => void) => {
      if (!(error instanceof SubscriptionRefusedError)) {
        return;
      }
      const message = t(`refused.${error.reason}`, { limit: error.limit });
      AccessibilityInfo.announceForAccessibility(message);
      Alert.alert(t("refused.title"), message, [
        { text: t("refused.ok"), onPress: onDismiss },
      ]);
    },
    [t]
  );
};
