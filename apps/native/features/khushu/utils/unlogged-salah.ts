import type { Salah } from "@alrisali/domain/shared";
import { Temporal } from "temporal-polyfill";

import type { EventBus } from "@/shared/lib/event-bus";
import type { AppEvents } from "@/shared/lib/events";

/**
 * Hears every un-ticked Salah (`SalahUnlogged`) and hands on its date and
 * Salah, so that Salah's Khushu can be removed. Returns the unsubscribe.
 */
export const listenForUnloggedSalah = (
  bus: EventBus<AppEvents>,
  onUnlogged: (key: { date: Temporal.PlainDate; salah: Salah }) => void
): (() => void) =>
  bus.on("SalahUnlogged", ({ date, salah }) =>
    onUnlogged({ date: Temporal.PlainDate.from(date), salah })
  );
