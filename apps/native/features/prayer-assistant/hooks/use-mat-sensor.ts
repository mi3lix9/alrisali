import {
  readMat,
  recalibrateMat,
  startMatSensor,
} from "@alrisali/domain/prayer-assistant";
import type {
  AssistantState,
  MatReading,
  MatSensor,
  Sighting,
} from "@alrisali/domain/prayer-assistant";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFrameOutput } from "react-native-vision-camera";
import type { CameraFrameOutput, Frame } from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";

import { keepMatDip, readMatDip } from "../data/mat-dip";

/** The ceiling's light needs no detail: the smallest common format will do. */
const FRAME_RESOLUTION = { width: 640, height: 480 };

/** The Y plane is sampled on this grid: enough for its mean and texture. */
const GRID_COLUMNS = 32;
const GRID_ROWS = 24;

/** Video-range luma runs from 16 (black) to 235 (white). */
const VIDEO_BLACK = 16;
const VIDEO_SPAN = 219;

/** The coverage meter moves in steps this big, so the screen doesn't redraw every frame. */
const COVERAGE_STEP = 0.05;

/** Frames dropped while the JS thread is busy are expected; nothing to report. */
const ignoreDroppedFrame = () => null;

/**
 * The frame worklet: samples the Y (luminance) plane of each 8-bit YUV
 * frame on a small grid, and hands its mean and spatial variance (0 to 1)
 * to the JS thread. Every frame and plane is released, so the camera never
 * stalls.
 */
const readLuma =
  (
    onLuma: (mean: number, variance: number) => void,
    onUnreadable: () => void
  ) =>
  (frame: Frame) => {
    "worklet";
    try {
      const planes = frame.getPlanes();
      try {
        const [luma] = planes;
        const format = frame.pixelFormat;
        if (
          !luma ||
          !format.startsWith("yuv-") ||
          !format.includes("-8-bit-")
        ) {
          scheduleOnRN(onUnreadable);
          return;
        }
        // Each plane property crosses into native code: read them once.
        const { width, height, bytesPerRow } = luma;
        const pixels = new Uint8Array(luma.getPixelBuffer());
        const videoRange = format.endsWith("-video");
        const stepX = Math.max(1, Math.floor(width / GRID_COLUMNS));
        const stepY = Math.max(1, Math.floor(height / GRID_ROWS));
        let sum = 0;
        let squares = 0;
        let count = 0;
        for (let y = Math.floor(stepY / 2); y < height; y += stepY) {
          for (let x = Math.floor(stepX / 2); x < width; x += stepX) {
            const raw = pixels[y * bytesPerRow + x] ?? 0;
            const value = videoRange
              ? Math.min(1, Math.max(0, (raw - VIDEO_BLACK) / VIDEO_SPAN))
              : raw / 255;
            sum += value;
            squares += value * value;
            count += 1;
          }
        }
        if (count > 0) {
          const mean = sum / count;
          scheduleOnRN(
            onLuma,
            mean,
            Math.max(0, squares / count - mean * mean)
          );
        }
      } finally {
        for (const plane of planes) {
          plane.dispose();
        }
      }
    } finally {
      frame.dispose();
    }
  };

interface MatLoop {
  /** The machine moved: the next frames read against this state. */
  follow: (state: AssistantState) => void;
  read: (mean: number, variance: number) => void;
  recalibrate: () => void;
}

/**
 * The Mat sensor between frames. Frames arrive between renders, so it
 * lives outside React state: every frame's sightings reach the machine,
 * and the screen redraws only when what it shows changes.
 */
const createMatLoop = (
  send: (sighting: Sighting) => void,
  show: (reading: MatReading) => void
): MatLoop => {
  /** Set on mount, well before the camera starts after placement. */
  let machine: AssistantState | null = null;
  let sensor: MatSensor | null = null;
  let shown: MatReading | null = null;

  const display = (reading: MatReading) => {
    if (
      shown?.calibrating === reading.calibrating &&
      shown.tooDark === reading.tooDark &&
      shown.covered === reading.covered &&
      Math.abs(shown.coverage - reading.coverage) < COVERAGE_STEP
    ) {
      return;
    }
    shown = reading;
    show(reading);
  };

  return {
    follow: (state) => {
      machine = state;
    },
    read: (mean, variance) => {
      if (!machine) {
        return;
      }
      const before = sensor ?? startMatSensor(readMatDip());
      const read = readMat(before, machine, {
        at: performance.now(),
        mean,
        variance,
      });
      ({ sensor } = read);
      for (const sighting of read.sightings) {
        send(sighting);
      }
      const { learnedDip } = read.reading;
      if (learnedDip !== null && before.reading.learnedDip === null) {
        keepMatDip(learnedDip);
      }
      display(read.reading);
    },
    recalibrate: () => {
      if (sensor) {
        sensor = recalibrateMat(sensor);
        display(sensor.reading);
      }
    },
  };
};

export interface MatSensorHandle {
  frameOutput: CameraFrameOutput;
  /** The latest reading; null until the first frame. */
  reading: MatReading | null;
  /** The camera's frames carry no 8-bit luminance plane to read. */
  unreadable: boolean;
  /** Learns the ceiling again, after the phone moved or the light changed. */
  recalibrate: () => void;
}

/**
 * Watches the ceiling's light from the phone lying on the mat and sends
 * each sujud it proves to the rak'ah machine as `confirmed`. The first sujud
 * of a Salah tunes the thresholds; the device keeps that dip for the next
 * Salah. Nothing leaves the device and no frame is kept.
 */
export const useMatSensor = (
  state: AssistantState,
  send: (sighting: Sighting) => void
): MatSensorHandle => {
  const [reading, setReading] = useState<MatReading | null>(null);
  const [unreadable, setUnreadable] = useState(false);
  // `send` and `setReading` are stable: one loop for the screen's life.
  const loop = useMemo(() => createMatLoop(send, setReading), [send]);

  useEffect(() => {
    loop.follow(state);
  }, [loop, state]);

  const onUnreadable = useCallback(() => setUnreadable(true), []);
  const onFrame = useMemo(
    () => readLuma(loop.read, onUnreadable),
    [loop, onUnreadable]
  );
  const frameOutput = useFrameOutput({
    targetResolution: FRAME_RESOLUTION,
    pixelFormat: "yuv",
    dropFramesWhileBusy: true,
    onFrameDropped: ignoreDroppedFrame,
    onFrame,
  });

  return { frameOutput, reading, unreadable, recalibrate: loop.recalibrate };
};
