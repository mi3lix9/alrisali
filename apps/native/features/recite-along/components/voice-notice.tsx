import { Alert, Button, Text } from "panelui-native";
import { RotateCwIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { Linking, View } from "react-native";

import type { VoiceSupport } from "../hooks/use-voice";

/**
 * Explains why the voice methods cannot listen and that touch takes over, or
 * that Arabic is recognised over the network on this device.
 */
export const VoiceNotice = ({ voice }: { voice: VoiceSupport }) => {
  const { t } = useTranslation("recite-along");
  const { support } = voice;
  if (!support) {
    return null;
  }
  if (support.usable) {
    return support.onDevice ? null : (
      <Text muted size="xs">
        {t("voice.network")}
      </Text>
    );
  }
  const blocked = support.reason === "denied";
  return (
    <Alert variant="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t(`voice.unavailable.${support.reason}`)}</Alert.Title>
        <Alert.Description>{t("voice.fallback")}</Alert.Description>
        <View className="flex-row flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" onPress={() => voice.retry()}>
            <RotateCwIcon size={16} />
            {t("voice.retry")}
          </Button>
          {blocked ? (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                void Linking.openSettings();
              }}
            >
              {t("voice.openSettings")}
            </Button>
          ) : null}
        </View>
      </Alert.Content>
    </Alert>
  );
};
