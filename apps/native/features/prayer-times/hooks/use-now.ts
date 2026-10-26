import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Temporal } from "temporal-polyfill";

/**
 * The current instant, ticking every `intervalMs` and again when the app
 * returns to the foreground, so a long background shows at once. It has no
 * time zone: Prayer Times put it on the location's clock, never the device's.
 * It does not tick while the app is in the background or while `enabled` is
 * false (a screen that lost focus); it catches up the moment either ends.
 */
export const useNow = (
  intervalMs: number,
  enabled = true
): Temporal.Instant => {
  const [now, setNow] = useState(() => Temporal.Now.instant());

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const tick = () => setNow(Temporal.Now.instant());
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
