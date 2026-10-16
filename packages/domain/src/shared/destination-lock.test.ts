import { describe, expect, it } from "vitest";

import { createKeyedSerial } from "./destination-lock";

const noop = () => {};

const gate = () => {
  let open = noop;
  // oxlint-disable-next-line promise/avoid-new -- a test gate
  const promise = new Promise<void>((resolve) => {
    open = () => resolve();
  });
  return { open, promise };
};

describe(createKeyedSerial, () => {
  it("runs tasks of one key one after another", async () => {
    const serial = createKeyedSerial();
    const events: string[] = [];
    const first = gate();
    const a = serial.run("k", async () => {
      events.push("a start");
      await first.promise;
      events.push("a end");
    });
    const b = serial.run("k", () => {
      events.push("b start");
      return Promise.resolve();
    });
    await Promise.resolve();
    expect(events).toStrictEqual(["a start"]);
    first.open();
    await Promise.all([a, b]);
    expect(events).toStrictEqual(["a start", "a end", "b start"]);
  });

  it("does not make different keys wait, and runs on after a failure", async () => {
    const serial = createKeyedSerial();
    const hold = gate();
    const slow = serial.run("x", () => hold.promise);
    await expect(serial.run("y", () => Promise.resolve(1))).resolves.toBe(1);
    const failing = serial.run("z", () => Promise.reject(new Error("no")));
    await expect(failing).rejects.toThrow("no");
    await expect(serial.run("z", () => Promise.resolve(2))).resolves.toBe(2);
    hold.open();
    await slow;
  });
});
