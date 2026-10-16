import { describe, expect, it, vi } from "vitest";

import { createEventBus } from "./event-bus";

interface TestEvents {
  SalahLogged: { salah: "fajr" | "dhuhr" };
  SignedOut: undefined;
}

type SalahLoggedListener = (payload: TestEvents["SalahLogged"]) => void;
type SignedOutListener = () => void;

describe(createEventBus, () => {
  it("delivers the payload to every listener of the emitted event", () => {
    const bus = createEventBus<TestEvents>();
    const first = vi.fn<SalahLoggedListener>();
    const second = vi.fn<SalahLoggedListener>();
    bus.on("SalahLogged", first);
    bus.on("SalahLogged", second);

    bus.emit("SalahLogged", { salah: "fajr" });

    expect(first).toHaveBeenCalledWith({ salah: "fajr" });
    expect(second).toHaveBeenCalledWith({ salah: "fajr" });
  });

  it("does not deliver to listeners of other events", () => {
    const bus = createEventBus<TestEvents>();
    const onSignedOut = vi.fn<SignedOutListener>();
    bus.on("SignedOut", onSignedOut);

    bus.emit("SalahLogged", { salah: "dhuhr" });

    expect(onSignedOut).not.toHaveBeenCalled();
  });

  it("emits payload-less events without an argument", () => {
    const bus = createEventBus<TestEvents>();
    const onSignedOut = vi.fn<SignedOutListener>();
    bus.on("SignedOut", onSignedOut);

    bus.emit("SignedOut");

    expect(onSignedOut).toHaveBeenCalledOnce();
  });

  it("stops delivering once the listener unsubscribes", () => {
    const bus = createEventBus<TestEvents>();
    const listener = vi.fn<SalahLoggedListener>();
    const unsubscribe = bus.on("SalahLogged", listener);

    unsubscribe();
    bus.emit("SalahLogged", { salah: "fajr" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("still reaches every listener when one unsubscribes while handling", () => {
    const bus = createEventBus<TestEvents>();
    const second = vi.fn<SignedOutListener>();
    const unsubscribeFirst = bus.on("SignedOut", () => unsubscribeFirst());
    bus.on("SignedOut", second);

    bus.emit("SignedOut");

    expect(second).toHaveBeenCalledOnce();
  });

  it("rejects unknown events and mismatched payloads at compile time", () => {
    const bus = createEventBus<TestEvents>();
    const listener = vi.fn<SignedOutListener>();

    // @ts-expect-error -- "Unknown" is not in the event map
    bus.on("Unknown", listener);
    // @ts-expect-error -- "isha" is not a payload SalahLogged accepts
    bus.emit("SalahLogged", { salah: "isha" });
    // @ts-expect-error -- SalahLogged requires a payload
    bus.emit("SalahLogged");
    // @ts-expect-error -- SignedOut carries no payload
    bus.emit("SignedOut", { salah: "fajr" });

    expect(listener).not.toHaveBeenCalled();
  });
});
