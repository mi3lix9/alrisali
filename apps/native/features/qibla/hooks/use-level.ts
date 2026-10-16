import { levelFromAcceleration } from "@alrisali/domain/qibla";
import type { Level } from "@alrisali/domain/qibla";
import { useFocusEffect } from "expo-router";
import { Accelerometer } from "expo-sensors";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

const UPDATE_MS = 100;
/** Smaller changes than this (in the bubble's -1..1 units) aren't re-rendered. */
const MIN_CHANGE = 0.02;

/**
 * iOS reports the direction of gravity and Android the force holding the
 * phone up; the domain reads the latter.
 */
const SIGN = Platform.OS === "ios" ? -1 : 1;

const differs = (a: Level | null, b: Level): boolean =>
  !a ||
  a.level !== b.level ||
  Math.abs(a.bubble.x - b.bubble.x) >= MIN_CHANGE ||
  Math.abs(a.bubble.y - b.bubble.y) >= MIN_CHANGE ||
  Math.round(a.tilt) !== Math.round(b.tilt);

/**
 * How level the phone is while the screen is focused, from the accelerometer;
 * null until the first reading, or when the device has no accelerometer.
 */
export const useLevel = (): Level | null => {
  const [level, setLevel] = useState<Level | null>(null);

  useFocusEffect(
    useCallback(() => {
      let stopped = false;
      let last: Level | null = null;
      let subscription: { remove: () => void } | undefined;
      const start = async () => {
        try {
          if (!(await Accelerometer.isAvailableAsync()) || stopped) {
            return;
          }
          Accelerometer.setUpdateInterval(UPDATE_MS);
          subscription = Accelerometer.addListener(({ x, y, z }) => {
            const next = levelFromAcceleration({
              x: SIGN * x,
              y: SIGN * y,
              z: SIGN * z,
            });
            if (differs(last, next)) {
              last = next;
              setLevel(next);
            }
          });
        } catch {
          // A device without the sensor just shows no level.
        }
      };
      start();
      return () => {
        stopped = true;
        subscription?.remove();
      };
    }, [])
  );

  return level;
};
