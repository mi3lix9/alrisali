import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Temporal } from "temporal-polyfill";

/**
 * The current time in the device's time zone, ticking every `intervalMs` and
 * again when the app returns to the foreground, so a trip across time zones
 * or a long background shows at once. It does not tick while the app is in
 * the background or while `enabled` is false (a screen that lost focus); it
 * catches up the moment either ends.
 */
export const useNow = (
  intervalMs: number,
  enabled = true
): Temporal.ZonedDateTime => {
  const [now, setNow] = useState(() => Temporal.Now.zonedDateTimeISO());

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const tick = () => setNow(Temporal.Now.zonedDateTimeISO());
    let stopTimer: (() => void) | undefined;
    const start = () => {
      tick();
      const timer = setInterval(tick, intervalMs);
      stopTimer = () => clearInterval(timer);
    };
    const stop = () => {
      stopTimer?.();
      stopTimer = undefined;
    };
    if (AppState.currentState === "active") {
      start();
    }
    const subscription = AppState.addEventListener("change", (state) => {
      stop();
      if (state === "active") {
        start();
      }
    });
    return () => {
      stop();
      subscription.remove();
    };
  }, [intervalMs, enabled]);

  return now;
};
