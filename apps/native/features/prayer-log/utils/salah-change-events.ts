import type { Salah } from "@alrisali/domain/shared";
import type { Temporal } from "temporal-polyfill";

import type { EventBus } from "@/shared/lib/event-bus";
import type { AppEvents } from "@/shared/lib/events";

/** One Salah ticked (`performed`) or un-ticked on a date. */
export interface SalahChange {
  date: Temporal.PlainDate;
  salah: Salah;
  performed: boolean;
}

/**
 * Announces a saved tick as `SalahLogged` and a saved un-tick as
 * `SalahUnlogged`, at `at` (epoch milliseconds).
 */
export const emitSalahChange = (
  bus: EventBus<AppEvents>,
  { date, salah, performed }: SalahChange,
  at: number
): void => {
  if (performed) {
    bus.emit("SalahLogged", { date: date.toString(), salah, loggedAt: at });
  } else {
    bus.emit("SalahUnlogged", {
      date: date.toString(),
      salah,
      unloggedAt: at,
    });
  }
};
