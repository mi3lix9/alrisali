import type { Sighting } from "@alrisali/domain/prayer-assistant";
import { Alert, Button, Spinner, Text } from "panelui-native";
import { RotateCwIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { Linking, View } from "react-native";

import { useTakbir } from "../hooks/use-takbir";

/**
 * Sound mode's sensor: listens for Takbirs and shows what it is doing:
 * getting the microphone ready, waiting for the opening Takbir, listening,
 * or why it cannot listen, so tap carries the Salah on.
 */
export const TakbirSensor = ({
  underWay,
  send,
}: {
  underWay: boolean;
  send: (sighting: Sighting) => void;
}) => {
  const { t } = useTranslation("prayer-assistant");
  const listening = useTakbir({ underWay, send });
  const { support, opened } = listening;

  if (!support) {
    return (
      <View className="flex-row items-center justify-center gap-2">
        <Spinner size="sm" />
        <Text muted>{t("sound.checking")}</Text>
      </View>
    );
  }
  if (support.usable) {
    return (
      <View className="gap-1">
        <Text weight="semibold" className="text-center">
          {opened ? t("sound.listening") : t("sound.sayOpening")}
        </Text>
        {support.onDevice ? null : (
          <Text muted size="xs" className="text-center">
            {t("sound.network")}
          </Text>
        )}
      </View>
    );
  }
  return (
    <Alert variant="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t(`sound.unavailable.${support.reason}`)}</Alert.Title>
        <Alert.Description>{t("sound.fallback")}</Alert.Description>
        <View className="flex-row flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" onPress={() => listening.retry()}>
            <RotateCwIcon size={16} />
            {t("sound.retry")}
          </Button>
          {support.reason === "denied" ? (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                void Linking.openSettings();
              }}
            >
              {t("sound.openSettings")}
            </Button>
          ) : null}
        </View>
      </Alert.Content>
    </Alert>
  );
};
