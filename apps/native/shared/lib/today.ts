import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Temporal } from "temporal-polyfill";

const MINUTE_MS = 60_000;

/**
 * The device's local date, checked every minute and on return to the
 * foreground, so midnight starts a new day without a relaunch.
 */
export const useToday = (): Temporal.PlainDate => {
  const [today, setToday] = useState(() => Temporal.Now.plainDateISO());

  useEffect(() => {
    const check = () =>
      setToday((shown) => {
        const now = Temporal.Now.plainDateISO();
        return now.equals(shown) ? shown : now;
      });
    const timer = setInterval(check, MINUTE_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        check();
      }
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return today;
};
