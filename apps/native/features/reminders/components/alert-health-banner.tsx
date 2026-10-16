import "../i18n";
import { router } from "expo-router";
import { Alert, Button } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useAlertHealth } from "../hooks/use-alert-health";

/** Home's banner: shown only while an Alert Health check fails. */
export const AlertHealthBanner = () => {
  const { t } = useTranslation("reminders");
  const { problems } = useAlertHealth();
  const [first] = problems;
  if (!first) {
    return null;
  }

  return (
    <Alert variant="warning" testID="alert-health-banner">
      <Alert.Indicator />
      <Alert.Content className="gap-3">
        <Alert.Title>{t("health.banner.title")}</Alert.Title>
        <Alert.Description>
          {t(`health.checks.${first}.failing`, { maker: "" })}
        </Alert.Description>
        <Button
          size="sm"
          testID="alert-health-banner-fix"
          onPress={() => router.push("/settings/alert-health")}
        >
          {t("health.banner.fix")}
        </Button>
      </Alert.Content>
    </Alert>
  );
};
