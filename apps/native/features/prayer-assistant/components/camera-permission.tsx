import { Alert, Button } from "panelui-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Linking, View } from "react-native";
import { useCameraPermission } from "react-native-vision-camera";

/**
 * Explains why the camera is wanted and asks only when the Believer taps
 * Allow (never on its own); once allowed, shows the sensor. When it is denied,
 * explains that tap carries the Salah on and links to Settings.
 */
export const CameraPermission = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation("prayer-assistant");
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();

  if (hasPermission) {
    return children;
  }
  if (canRequestPermission) {
    return (
      <Alert variant="info" testID="camera-permission-reason">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{t("camera.reasonTitle")}</Alert.Title>
          <Alert.Description>{t("camera.reason")}</Alert.Description>
          <View className="flex-row flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              testID="camera-permission-allow"
              onPress={() => {
                void requestPermission();
              }}
            >
              {t("camera.allow")}
            </Button>
          </View>
        </Alert.Content>
      </Alert>
    );
  }
  return (
    <Alert variant="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("camera.denied")}</Alert.Title>
        <Alert.Description>{t("camera.fallback")}</Alert.Description>
        <View className="flex-row flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              void Linking.openSettings();
            }}
          >
            {t("camera.openSettings")}
          </Button>
        </View>
      </Alert.Content>
    </Alert>
  );
};
