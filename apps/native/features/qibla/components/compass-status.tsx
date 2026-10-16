import { Alert, Button, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import type { Compass } from "../hooks/use-compass";

/** What the compass needs, or can't do, when it isn't live. */
export const CompassStatus = ({
  compass,
  allow,
}: {
  compass: Exclude<Compass, { status: "live" }>;
  allow: () => void;
}) => {
  const { t } = useTranslation("qibla");

  if (compass.status === "permission") {
    return (
      <Alert variant="info">
        <Alert.Indicator />
        <Alert.Content className="gap-2">
          <Alert.Title>{t("compass.permissionTitle")}</Alert.Title>
          <Alert.Description>
            {compass.blocked
              ? t("compass.blockedDescription")
              : t("compass.permissionDescription")}
          </Alert.Description>
          <Button variant="outline" onPress={allow}>
            {compass.blocked ? t("compass.openSettings") : t("compass.allow")}
          </Button>
        </Alert.Content>
      </Alert>
    );
  }
  if (compass.status === "unavailable") {
    return (
      <Alert variant="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{t("compass.unavailableTitle")}</Alert.Title>
          <Alert.Description>
            {t("compass.unavailableDescription")}
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }
  return (
    <Text muted className="text-center" accessibilityLiveRegion="polite">
      {compass.status === "checking"
        ? t("compass.checking")
        : t("compass.waiting")}
    </Text>
  );
};
