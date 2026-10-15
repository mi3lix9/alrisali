import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Temporal } from "temporal-polyfill";

/**
 * The current time in the device's time zone, ticking every `intervalMs` and
 * again when the app returns to the foreground, so a trip across time zones
 * or a long background shows at once.
 */
export const useNow = (intervalMs: number): Temporal.ZonedDateTime => {
  const [now, setNow] = useState(() => Temporal.Now.zonedDateTimeISO());

  useEffect(() => {
    const tick = () => setNow(Temporal.Now.zonedDateTimeISO());
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
