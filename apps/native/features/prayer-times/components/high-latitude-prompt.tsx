import { isHighLatitude } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Alert, Button } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useHighLatitudePrompt } from "../hooks/use-high-latitude-prompt";

/**
 * A one-time prompt, once per country, for a Believer at a high latitude to
 * review the Fajr and Isha rule in Prayer settings.
 */
export const HighLatitudePrompt = ({
  coordinates,
}: {
  coordinates: { latitude: number; longitude: number };
}) => {
  const { t } = useTranslation("prayer-times");
  const { shown, dismiss } = useHighLatitudePrompt(
    isHighLatitude(coordinates.latitude) ? coordinates : null
  );

  return shown ? (
    <Alert variant="info" testID="prayer-high-latitude-prompt">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("highLatitude.title")}</Alert.Title>
        <Alert.Description>{t("highLatitude.description")}</Alert.Description>
        <View className="flex-row gap-2 pt-2">
          <Button
            size="sm"
            testID="prayer-high-latitude-review"
            onPress={() => {
              dismiss();
              router.push("/settings/prayer");
            }}
          >
            {t("highLatitude.review")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            testID="prayer-high-latitude-dismiss"
            onPress={dismiss}
          >
            {t("highLatitude.dismiss")}
          </Button>
        </View>
      </Alert.Content>
    </Alert>
  ) : null;
};
