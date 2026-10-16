import { MAT_EXPOSURE_LOCK_MS } from "@alrisali/domain/prayer-assistant";
import type {
  AssistantState,
  Sighting,
} from "@alrisali/domain/prayer-assistant";
import { Alert, Button, Progress, Spinner, Text } from "panelui-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useCamera } from "react-native-vision-camera";
import type { CameraController, Constraint } from "react-native-vision-camera";

import { useForeground } from "../hooks/use-foreground";
import { useMatSensor } from "../hooks/use-mat-sensor";
import { CameraPermission } from "./camera-permission";

/** Time to lay the phone on the mat and stand back before the camera looks. */
const PLACEMENT_SECONDS = 10;

const CONSTRAINTS: Constraint[] = [{ fps: 15 }];

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

/**
 * Freezes the exposure (and white balance) the camera settled on for the
 * ceiling, so a sujud dims the frame instead of the camera raising its gain.
 * iOS only, where the device allows it; elsewhere detection leans on the
 * sudden dip and the learned thresholds. Best effort: an unlocked exposure
 * only makes the dip shallower.
 */
const lockExposure = async (controller: CameraController): Promise<void> => {
  const { device } = controller;
  try {
    if (device.supportsExposureLocking) {
      await controller.lockCurrentExposure();
    }
    if (device.supportsWhiteBalanceLocking) {
      await controller.lockCurrentWhiteBalance();
    }
  } catch {
    // The camera stays on automatic exposure.
  }
};

/** Back to automatic exposure, to settle on a changed light. */
const unlockExposure = async (controller: CameraController): Promise<void> => {
  try {
    await controller.resetFocus();
  } catch {
    // Nothing was locked.
  }
};

interface MatSensorProps {
  state: AssistantState;
  send: (sighting: Sighting) => void;
}

const Watching = ({ state, send }: MatSensorProps) => {
  const { t } = useTranslation("prayer-assistant");
  const foreground = useForeground();
  const remaining = usePlacement();
  const sensor = useMatSensor(state, send);
  const isActive = foreground && remaining === 0 && !sensor.unreadable;
  const calibrating = sensor.reading?.calibrating ?? true;
  const controller = useCamera({
    isActive,
    device: "front",
    outputs: [sensor.frameOutput],
    constraints: CONSTRAINTS,
  });

  // Each calibration locks the exposure once it has settled on the ceiling.
  useEffect(() => {
    if (!controller || !isActive || !calibrating) {
      return;
    }
    const timer = setTimeout(() => {
      void lockExposure(controller);
    }, MAT_EXPOSURE_LOCK_MS);
    return () => clearTimeout(timer);
  }, [controller, isActive, calibrating]);

  const recalibrate = () => {
    if (controller) {
      void unlockExposure(controller);
    }
    sensor.recalibrate();
  };

  if (sensor.unreadable) {
    return (
      <Alert variant="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{t("mat.unreadable")}</Alert.Title>
          <Alert.Description>{t("camera.fallback")}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (remaining > 0) {
    return (
      <Text weight="semibold" className="text-center">
        {t("mat.placing", { value: remaining })}
      </Text>
    );
  }

  const { reading } = sensor;
  if (!reading || reading.calibrating) {
    return (
      <View className="flex-row items-center justify-center gap-2">
        <Spinner size="sm" />
        <Text weight="semibold">{t("mat.calibrating")}</Text>
      </View>
    );
  }

  const recalibrateButton = (
    <Button size="sm" variant="ghost" onPress={recalibrate}>
      {t("mat.recalibrate")}
    </Button>
  );

  if (reading.tooDark) {
    return (
      <Alert variant="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{t("mat.tooDark")}</Alert.Title>
          <Alert.Description>{t("camera.fallback")}</Alert.Description>
          <View className="flex-row flex-wrap gap-2 pt-2">
            {recalibrateButton}
          </View>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <View className="gap-2">
      <Text weight="semibold" className="text-center">
        {reading.covered ? t("mat.covered") : t("mat.watching")}
      </Text>
      <Progress
        value={reading.coverage}
        minValue={0}
        maxValue={1}
        accessibilityLabel={t("mat.meter")}
      />
      <View className="flex-row items-center justify-between gap-2">
        <Text muted size="sm" className="flex-1">
          {t("mat.privacy")}
        </Text>
        {recalibrateButton}
      </View>
    </View>
  );
};

/**
 * Mat mode's sensor: once the phone lies face-up on the mat, the front
 * camera watches the ceiling's light and each sujud over it counts. The
 * camera stops when the screen closes or the app leaves the foreground; tap
 * carries the Salah on whenever it can't watch.
 */
export const MatSensor = (props: MatSensorProps) => (
  <CameraPermission>
    <Watching {...props} />
  </CameraPermission>
);
