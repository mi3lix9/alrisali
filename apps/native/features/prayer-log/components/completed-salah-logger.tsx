import { useEffect } from "react";
import { Temporal } from "temporal-polyfill";

import { events } from "@/shared/lib/events";

import { useSetSalahPerformed } from "../data/prayer-logs";

/**
 * Mounted once at the root: ticks a Salah the Prayer Assistant followed to
 * the end (`SalahCompleted`). Saving emits `SalahLogged`, as a tick does.
 */
export const CompletedSalahLogger = () => {
  const { mutate: setPerformed } = useSetSalahPerformed();

  useEffect(
    () =>
      events.on("SalahCompleted", ({ date, salah }) =>
        setPerformed({
          date: Temporal.PlainDate.from(date),
          salah,
          performed: true,
        })
      ),
    [setPerformed]
  );

  return null;
};
