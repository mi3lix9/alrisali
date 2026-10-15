import type { PoseEngine, Sighting } from "@alrisali/domain/prayer-assistant";
import { Alert, Spinner, Switch, Text } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Camera, useCamera } from "react-native-vision-camera";
import type { CameraFrameOutput, Constraint } from "react-native-vision-camera";

import { useForeground } from "../hooks/use-foreground";
import { usePoseSensor } from "../hooks/use-pose-sensor";
import { CameraPermission } from "./camera-permission";

/** MoveNet reads about ten frames a second; more would only cost battery. */
const CONSTRAINTS: Constraint[] = [{ fps: 15 }];

interface CameraProps {
  isActive: boolean;
  frameOutput: CameraFrameOutput;
}

/** The front camera feeding MoveNet, with no preview on screen. */
const HiddenCamera = ({ isActive, frameOutput }: CameraProps) => {
  useCamera({
    isActive,
    device: "front",
    outputs: [frameOutput],
    constraints: CONSTRAINTS,
  });
  return null;
};

/** The front camera feeding MoveNet, its preview shown on request. */
const PreviewCamera = ({ isActive, frameOutput }: CameraProps) => (
  <View className="aspect-[3/4] w-1/2 self-center overflow-hidden rounded-2xl">
    <Camera
      style={StyleSheet.absoluteFill}
      isActive={isActive}
      device="front"
      outputs={[frameOutput]}
      constraints={CONSTRAINTS}
      resizeMode="cover"
    />
  </View>
);

interface PoseSensorProps {
  engine: PoseEngine;
  bowSensitivity: number;
  /** The Believer is still in the first Qiyam. */
  calibrating: boolean;
  send: (sighting: Sighting) => void;
}

const Watching = ({
  engine,
  bowSensitivity,
  calibrating,
  send,
}: PoseSensorProps) => {
  const { t } = useTranslation("prayer-assistant");
  const foreground = useForeground();
  const [preview, setPreview] = useState(false);
  const sensor = usePoseSensor({ engine, bowSensitivity, calibrating, send });

  if (sensor.status === "unsupported") {
    return (
      <Alert variant="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{t("camera.unsupported")}</Alert.Title>
          <Alert.Description>{t("camera.fallback")}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  const isActive = foreground && sensor.status === "watching";
  let status = t("camera.notSeen");
  if (sensor.status === "starting") {
    status = t("camera.starting");
  } else if (sensor.position !== null) {
    status =
      calibrating && sensor.position === "qiyam"
        ? t("camera.ready")
        : t("camera.watching");
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-center gap-2">
        {sensor.status === "starting" ? <Spinner size="sm" /> : null}
        <Text weight="semibold" className="text-center">
          {status}
        </Text>
      </View>
      <Switch
        label={t("camera.showPreview")}
        value={preview}
        onValueChange={setPreview}
      />
      {preview ? (
        <PreviewCamera isActive={isActive} frameOutput={sensor.frameOutput} />
      ) : (
        <HiddenCamera isActive={isActive} frameOutput={sensor.frameOutput} />
      )}
    </View>
  );
};

/**
 * Camera and Head Height modes' sensor: asks for the camera, then follows
 * the Believer's Positions from the front camera with the preview hidden
 * unless they ask to see it. The camera stops when the screen closes or the
 * app leaves the foreground; tap carries the Salah on if it can't watch.
 */
export const PoseSensor = (props: PoseSensorProps) => (
  <CameraPermission>
    <Watching {...props} />
  </CameraPermission>
);
