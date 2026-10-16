import { readingDate } from "@alrisali/domain/reading-completion";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

/**
 * Today, as the Believer's local calendar day. Moves on when the app returns
 * to the foreground on a later day, so a reader left open overnight marks the
 * new day.
 */
export const useReadingDate = (): string => {
  const [date, setDate] = useState(() => readingDate(new Date()));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setDate(readingDate(new Date()));
      }
    });
    return () => subscription.remove();
  }, []);

  return date;
};
