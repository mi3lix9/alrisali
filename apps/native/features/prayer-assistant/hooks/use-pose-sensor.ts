import {
  classifyPose,
  decodeMoveNet,
  MOVENET_INPUT_SIZE,
  POSE_FRAME_MS,
  startPoseClassifier,
} from "@alrisali/domain/prayer-assistant";
import type {
  FrameOrientation,
  PoseClassifier,
  PoseEngine,
  Position,
  Sighting,
} from "@alrisali/domain/prayer-assistant";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useTensorflowModel } from "react-native-fast-tflite";
import type { TfliteModel } from "react-native-fast-tflite";
import { useFrameOutput } from "react-native-vision-camera";
import type { CameraFrameOutput, Frame } from "react-native-vision-camera";
import {
  isResizerAvailable,
  useResizer,
} from "react-native-vision-camera-resizer";
import type { Resizer } from "react-native-vision-camera-resizer";
import { scheduleOnRN } from "react-native-worklets";

import moveNet from "@/assets/models/movenet_lightning_f16.tflite";

/** A small frame is enough for a 192×192 model and spares the battery. */
const FRAME_RESOLUTION = { width: 640, height: 480 };

/**
 * The CPU runs MoveNet: the CoreML delegate returned corrupt float16
 * coordinates on the simulator (docs/rebuild/spikes/prayer-assistant.md).
 */
const CPU_ONLY = [] as const;

/** Frames dropped while MoveNet is busy are expected; nothing to report. */
const ignoreDroppedFrame = () => null;

/** Until MoveNet and the resizer are ready, frames go straight back. */
const skipFrame = (frame: Frame) => {
  "worklet";
  frame.dispose();
};

/**
 * The frame worklet: resizes each frame to MoveNet's input on the GPU, runs
 * MoveNet on the CPU and hands the keypoints to the JS thread. Every frame
 * and resized buffer is released, so the camera never stalls.
 */
const readPoses =
  (
    model: TfliteModel,
    resizer: Resizer,
    onPose: (output: number[], orientation: FrameOrientation) => void
  ) =>
  (frame: Frame) => {
    "worklet";
    try {
      const { orientation } = frame;
      const resized = resizer.resize(frame);
      try {
        const [output] = model.runSync([resized.getPixelBuffer()]);
        if (output) {
          scheduleOnRN(onPose, [...new Float32Array(output)], orientation);
        }
      } finally {
        resized.dispose();
      }
    } finally {
      frame.dispose();
    }
  };

interface PoseReading {
  classifier: PoseClassifier;
  position: Position | null;
  /** When this reading was taken, on the monotonic clock. */
  at: number;
}

interface PoseFrame {
  output: number[];
  orientation: FrameOrientation;
  calibrating: boolean;
  at: number;
}

const NOT_READ = Number.NEGATIVE_INFINITY;

/**
 * Classifies a frame's keypoints, at most once per POSE_FRAME_MS: the
 * classifier's smoothing and calibration count frames at that rate.
 */
const readFrame = (reading: PoseReading, frame: PoseFrame): PoseReading => {
  if (frame.at - reading.at < POSE_FRAME_MS) {
    return reading;
  }
  const next = classifyPose(
    reading.classifier,
    decodeMoveNet(frame.output, frame.orientation),
    frame.calibrating
  );
  return { ...next, at: frame.at };
};

export type PoseSensorStatus =
  /** The model or the resizer is still loading. */
  | "starting"
  /** The device can't resize camera frames on the GPU. */
  | "unsupported"
  | "watching";

interface PoseSensorOptions {
  engine: PoseEngine;
  bowSensitivity: number;
  /** The Believer is still in the first Qiyam: learn their stand. */
  calibrating: boolean;
  send: (sighting: Sighting) => void;
}

export interface PoseSensor {
  status: PoseSensorStatus;
  frameOutput: CameraFrameOutput;
  /** The latest reading: null while no Position is recognised. */
  position: Position | null;
}

/**
 * Runs MoveNet on camera frames and sends each classified Position to the
 * rak'ah machine as `sensed`, about ten times a second. Nothing leaves the
 * device and no frame is kept.
 */
export const usePoseSensor = ({
  engine,
  bowSensitivity,
  calibrating,
  send,
}: PoseSensorOptions): PoseSensor => {
  const plugin = useTensorflowModel(moveNet, [...CPU_ONLY]);
  const resizerAvailable = isResizerAvailable();
  const { resizer, state: resizerState } = useResizer({
    width: MOVENET_INPUT_SIZE,
    height: MOVENET_INPUT_SIZE,
    channelOrder: "rgb",
    dataType: "uint8",
    scaleMode: "contain",
    pixelLayout: "interleaved",
  });
  const model = plugin.state === "loaded" ? plugin.model : undefined;

  const [reading, read] = useReducer(readFrame, undefined, () => ({
    classifier: startPoseClassifier(engine, bowSensitivity),
    position: null,
    at: NOT_READ,
  }));

  const onPose = useCallback(
    (output: number[], orientation: FrameOrientation) =>
      read({ output, orientation, calibrating, at: performance.now() }),
    [calibrating]
  );

  // Every reading goes to the rak'ah machine, which times the holds.
  useEffect(() => {
    if (reading.at !== NOT_READ) {
      send({ kind: "sensed", position: reading.position });
    }
  }, [reading, send]);

  const onFrame = useMemo(
    () => (model && resizer ? readPoses(model, resizer, onPose) : skipFrame),
    [model, resizer, onPose]
  );
  const frameOutput = useFrameOutput({
    targetResolution: FRAME_RESOLUTION,
    pixelFormat: "yuv",
    dropFramesWhileBusy: true,
    onFrameDropped: ignoreDroppedFrame,
    onFrame,
  });

  const unsupported =
    !resizerAvailable || resizerState === "error" || plugin.state === "error";
  const ready = model !== undefined && resizer !== undefined;
  let status: PoseSensorStatus = "starting";
  if (unsupported) {
    status = "unsupported";
  } else if (ready) {
    status = "watching";
  }

  return { status, frameOutput, position: reading.position };
};
