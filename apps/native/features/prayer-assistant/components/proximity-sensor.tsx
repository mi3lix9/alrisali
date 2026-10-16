import type {
  AssistantState,
  Sighting,
} from "@alrisali/domain/prayer-assistant";
import { Alert, Text } from "panelui-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { hasProximitySensor } from "../data/proximity-module";
import { useForeground } from "../hooks/use-foreground";
import { useProximitySensor } from "../hooks/use-proximity-sensor";

/** Time to lay the phone on the mat and stand back before the sensor listens. */
const PLACEMENT_SECONDS = 10;

/** Seconds left to place the phone, counting down to 0. */
const usePlacement = (): number => {
  const [remaining, setRemaining] = useState(PLACEMENT_SECONDS);
  useEffect(() => {
    if (remaining === 0) {
      return;
    }
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  return remaining;
};

interface ProximitySensorProps {
  state: AssistantState;
  send: (sighting: Sighting) => void;
}

const Listening = ({ state, send }: ProximitySensorProps) => {
  const { t } = useTranslation("prayer-assistant");
  const foreground = useForeground();
  const remaining = usePlacement();
  const near = useProximitySensor(state, send, foreground && remaining === 0);

  if (remaining > 0) {
    return (
      <Text weight="semibold" className="text-center">
        {t("proximity.placing", { value: remaining })}
      </Text>
    );
  }

  return (
    <View className="gap-2">
      <Text weight="semibold" className="text-center">
        {near ? t("proximity.near") : t("proximity.watching")}
      </Text>
      <Text muted size="sm" className="text-center">
        {t("proximity.privacy")}
      </Text>
    </View>
  );
};

/**
 * Proximity mode's sensor: once the phone lies face-up on the mat, each
 * sujud with the forehead over the proximity sensor counts. It listens only
 * while the app is in the foreground; tap carries the Salah on whenever the
 * sensor can't.
 */
export const ProximitySensor = (props: ProximitySensorProps) => {
  const { t } = useTranslation("prayer-assistant");
  if (hasProximitySensor()) {
    return <Listening {...props} />;
  }
  return (
    <Alert variant="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("proximity.unsupported")}</Alert.Title>
        <Alert.Description>{t("camera.fallback")}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
};
