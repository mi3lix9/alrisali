import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Temporal } from "temporal-polyfill";

/**
 * The current instant, ticking every `intervalMs` and again when the app
 * returns to the foreground, so a long background shows at once. It has no
 * time zone: Prayer Times put it on the location's clock, never the device's.
 */
export const useNow = (intervalMs: number): Temporal.Instant => {
  const [now, setNow] = useState(() => Temporal.Now.instant());

  useEffect(() => {
    const tick = () => setNow(Temporal.Now.instant());
    const timer = setInterval(tick, intervalMs);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        tick();
      }
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
};
