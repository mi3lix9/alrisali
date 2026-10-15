import type { Salah } from "@alrisali/domain/shared";
import type { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { createEventBus } from "@/shared/lib/event-bus";
import type { AppEvents } from "@/shared/lib/events";

import { listenForUnloggedSalah } from "./unlogged-salah";

const AT = 1_760_590_800_000;

describe(listenForUnloggedSalah, () => {
  it("removes the Khushu of a Salah that was un-ticked", () => {
    const bus = createEventBus<AppEvents>();
    const removed: string[] = [];
    listenForUnloggedSalah(
      bus,
      ({ date, salah }: { date: Temporal.PlainDate; salah: Salah }) =>
        removed.push(`${date.toString()}:${salah}`)
    );

    bus.emit("SalahUnlogged", {
      date: "2026-10-16",
      salah: "maghrib",
      unloggedAt: AT,
    });

    expect(removed).toStrictEqual(["2026-10-16:maghrib"]);
  });

  it("stops listening once unsubscribed", () => {
    const bus = createEventBus<AppEvents>();
    const removed: string[] = [];
    const unsubscribe = listenForUnloggedSalah(bus, ({ salah }) =>
      removed.push(salah)
    );

    unsubscribe();
    bus.emit("SalahUnlogged", {
      date: "2026-10-16",
      salah: "fajr",
      unloggedAt: AT,
    });

    expect(removed).toStrictEqual([]);
  });
});
