import {
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  watchHeadingAsync,
} from "expo-location";
import type {
  LocationHeadingObject,
  LocationSubscription,
} from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { AppState, Linking, Platform } from "react-native";

/** Without a first reading by then, the device has no usable compass. */
const NO_READING_MS = 3000;
/** Smaller changes than this aren't worth a re-render. */
const MIN_CHANGE_DEGREES = 0.5;
/** expo-location's calibration level at or below which to ask for one. */
const LOW_ACCURACY = 1;

type Permission = "checking" | "granted" | "ask" | "blocked";

export interface HeadingReading {
  /** Degrees clockwise from north. */
  heading: number;
  /** False while only magnetic north is known. */
  trueNorth: boolean;
  /** The compass reports poor calibration. */
  needsCalibration: boolean;
}

export type Compass =
  | { status: "checking" | "waiting" | "unavailable" }
  | { status: "permission"; blocked: boolean }
  | ({ status: "live" } & HeadingReading);

const readPermission = async (): Promise<Permission> => {
  const { granted, canAskAgain } = await getForegroundPermissionsAsync();
  if (granted) {
    return "granted";
  }
  return canAskAgain ? "ask" : "blocked";
};

const refreshPermission = async (
  set: (permission: Permission) => void
): Promise<void> => {
  try {
    set(await readPermission());
  } catch {
    set("blocked");
  }
};

const askPermission = async (
  set: (permission: Permission) => void
): Promise<void> => {
  try {
    const { granted, canAskAgain } = await requestForegroundPermissionsAsync();
    if (granted) {
      set("granted");
      return;
    }
    set(canAskAgain ? "ask" : "blocked");
  } catch {
    set("blocked");
  }
};

const toReading = ({
  trueHeading,
  magHeading,
  accuracy,
}: LocationHeadingObject): HeadingReading => ({
  // iOS reports -1 for true north until it knows where the device is.
  heading: trueHeading >= 0 ? trueHeading : magHeading,
  trueNorth: trueHeading >= 0,
  needsCalibration: accuracy <= LOW_ACCURACY,
});

const differs = (a: HeadingReading | null, b: HeadingReading): boolean => {
  if (!a || a.trueNorth !== b.trueNorth) {
    return true;
  }
  if (a.needsCalibration !== b.needsCalibration) {
    return true;
  }
  const change = Math.abs(a.heading - b.heading);
  return Math.min(change, 360 - change) >= MIN_CHANGE_DEGREES;
};

/**
 * Streams the device heading until the returned stop is called. Reports a
 * failure when the stream errors or stays silent (no magnetometer).
 */
const watchCompass = (
  onReading: (reading: HeadingReading) => void,
  onFailure: () => void
): (() => void) => {
  let subscription: LocationSubscription | undefined;
  let stopped = false;
  let last: HeadingReading | null = null;
  const silence = setTimeout(onFailure, NO_READING_MS);

  const receive = (heading: LocationHeadingObject) => {
    clearTimeout(silence);
    const reading = toReading(heading);
    if (differs(last, reading)) {
      last = reading;
      onReading(reading);
    }
  };
  const fail = () => {
    clearTimeout(silence);
    onFailure();
  };
  const start = async () => {
    try {
      const started = await watchHeadingAsync(receive, fail);
      if (stopped) {
        started.remove();
      } else {
        subscription = started;
      }
    } catch {
      fail();
    }
  };

  start();
  return () => {
    stopped = true;
    clearTimeout(silence);
    subscription?.remove();
  };
};

const hasCompass = Platform.OS === "ios" || Platform.OS === "android";

/**
 * The device's compass heading while the screen is focused. The heading needs
 * location access (true north comes from the location), which is asked for
 * only when the Believer taps `allow`; access granted in the device's Settings
 * is picked up when the app returns to the foreground.
 */
export const useCompass = (): { compass: Compass; allow: () => void } => {
  const [permission, setPermission] = useState<Permission>("checking");
  const [reading, setReading] = useState<HeadingReading | null>(null);
  const [failed, setFailed] = useState(false);

  const check = useEffectEvent(() => {
    refreshPermission(setPermission);
  });

  useEffect(() => {
    if (!hasCompass) {
      return;
    }
    check();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        check();
      }
    });
    return () => subscription.remove();
  }, []);

  const granted = permission === "granted";
  useFocusEffect(
    useCallback(() => {
      if (!hasCompass || !granted) {
        return;
      }
      setFailed(false);
      return watchCompass(setReading, () => setFailed(true));
    }, [granted])
  );

  const allow = () => {
    if (permission === "blocked") {
      Linking.openSettings();
      return;
    }
    askPermission(setPermission);
  };

  let compass: Compass;
  if (!hasCompass || (granted && failed && !reading)) {
    compass = { status: "unavailable" };
  } else if (permission === "checking") {
    compass = { status: "checking" };
  } else if (!granted) {
    compass = { status: "permission", blocked: permission === "blocked" };
  } else if (reading) {
    compass = { status: "live", ...reading };
  } else {
    compass = { status: "waiting" };
  }
  return { compass, allow };
};
