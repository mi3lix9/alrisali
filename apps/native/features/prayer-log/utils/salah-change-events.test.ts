import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { createEventBus } from "@/shared/lib/event-bus";
import type { AppEvents } from "@/shared/lib/events";

import { emitSalahChange } from "./salah-change-events";

const AT = 1_760_590_800_000;
const DATE = Temporal.PlainDate.from("2026-10-16");

const listen = () => {
  const bus = createEventBus<AppEvents>();
  const heard: unknown[] = [];
  bus.on("SalahLogged", (payload) => heard.push(["SalahLogged", payload]));
  bus.on("SalahUnlogged", (payload) => heard.push(["SalahUnlogged", payload]));
  return { bus, heard };
};

describe(emitSalahChange, () => {
  it("emits SalahLogged for a tick", () => {
    const { bus, heard } = listen();

    emitSalahChange(bus, { date: DATE, salah: "fajr", performed: true }, AT);

    expect(heard).toStrictEqual([
      ["SalahLogged", { date: "2026-10-16", salah: "fajr", loggedAt: AT }],
    ]);
  });

  it("emits SalahUnlogged for an un-tick", () => {
    const { bus, heard } = listen();

    emitSalahChange(bus, { date: DATE, salah: "isha", performed: false }, AT);

    expect(heard).toStrictEqual([
      ["SalahUnlogged", { date: "2026-10-16", salah: "isha", unloggedAt: AT }],
    ]);
  });
});
