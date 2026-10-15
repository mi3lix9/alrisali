import { Alert, Button, Spinner, Text } from "panelui-native";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Linking, View } from "react-native";
import { useCameraPermission } from "react-native-vision-camera";

/**
 * Asks for the camera, then shows the sensor; when it is denied, explains
 * that tap carries the Salah on and links to Settings.
 */
export const CameraPermission = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation("prayer-assistant");
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();

  useEffect(() => {
    if (!hasPermission && canRequestPermission) {
      void requestPermission();
    }
  }, [hasPermission, canRequestPermission, requestPermission]);

  if (hasPermission) {
    return children;
  }
  if (canRequestPermission) {
    return (
      <View className="flex-row items-center justify-center gap-2">
        <Spinner size="sm" />
        <Text muted>{t("camera.asking")}</Text>
      </View>
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
