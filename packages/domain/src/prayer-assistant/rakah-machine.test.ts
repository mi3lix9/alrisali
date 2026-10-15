import { describe, expect, it } from "vitest";

import { completesAt, currentStep, observe, startSalah } from "./rakah-machine";
import type { AssistantState, Observation, Position } from "./rakah-machine";

const NORMAL = { pace: "normal" } as const;

const feed = (
  state: AssistantState,
  observations: readonly Observation[]
): AssistantState => {
  let next = state;
  for (const observation of observations) {
    next = observe(next, observation);
  }
  return next;
};

/** Taps until the Salah is in its final Tashahhud, listing each step. */
const tapToFinalTashahhud = (state: AssistantState) => {
  const steps = [currentStep(state)];
  let at = 0;
  let next = state;
  while (!currentStep(next).final) {
    at += 1000;
    next = observe(next, { kind: "advance", at });
    steps.push(currentStep(next));
  }
  return { state: next, steps, at };
};

describe(startSalah, () => {
  it.each([
    ["fajr", 2],
    ["dhuhr", 4],
    ["asr", 4],
    ["maghrib", 3],
    ["isha", 4],
  ] as const)("counts %s as %i Rak'ahs", (salah, rakahs) => {
    const { steps } = tapToFinalTashahhud(startSalah(salah, NORMAL));
    expect(steps.at(-1)).toStrictEqual({
      rakah: rakahs,
      position: "tashahhud",
      final: true,
    });
    expect(new Set(steps.map((step) => step.rakah)).size).toBe(rakahs);
  });

  it("starts standing in the first Rak'ah", () => {
    expect(currentStep(startSalah("fajr", NORMAL))).toStrictEqual({
      rakah: 1,
      position: "qiyam",
      final: false,
    });
  });
});

describe("tapping through a Salah", () => {
  it("walks Fajr through each Position, then the final Tashahhud", () => {
    const { steps } = tapToFinalTashahhud(startSalah("fajr", NORMAL));
    expect(
      steps.map(({ rakah, position }) => `${rakah}:${position}`)
    ).toStrictEqual([
      "1:qiyam",
      "1:ruku",
      "1:itidal",
      "1:sujud",
      "1:jalsa",
      "1:sujud",
      "2:qiyam",
      "2:ruku",
      "2:itidal",
      "2:sujud",
      "2:jalsa",
      "2:sujud",
      "2:tashahhud",
    ]);
  });

  it("sits for the middle Tashahhud after the second Rak'ah of Maghrib", () => {
    const { steps } = tapToFinalTashahhud(startSalah("maghrib", NORMAL));
    const tashahhuds = steps.filter((step) => step.position === "tashahhud");
    expect(tashahhuds).toStrictEqual([
      { rakah: 2, position: "tashahhud", final: false },
      { rakah: 3, position: "tashahhud", final: true },
    ]);
    const middle = steps.findIndex((step) => step.position === "tashahhud");
    expect(steps[middle + 1]).toStrictEqual({
      rakah: 3,
      position: "qiyam",
      final: false,
    });
  });

  it("has only the middle and final Tashahhud in a four-Rak'ah Salah", () => {
    const { steps } = tapToFinalTashahhud(startSalah("isha", NORMAL));
    expect(
      steps
        .filter((step) => step.position === "tashahhud")
        .map((step) => step.rakah)
    ).toStrictEqual([2, 4]);
  });

  it("can step back after a mistaken tap", () => {
    const state = feed(startSalah("fajr", NORMAL), [
      { kind: "advance", at: 1000 },
      { kind: "advance", at: 2000 },
      { kind: "back", at: 3000 },
    ]);
    expect(currentStep(state).position).toBe("ruku");
  });

  it("does not step back before the first Position", () => {
    const state = observe(startSalah("fajr", NORMAL), { kind: "back", at: 0 });
    expect(currentStep(state)).toStrictEqual({
      rakah: 1,
      position: "qiyam",
      final: false,
    });
  });
});

describe("the final Tashahhud hold", () => {
  it("ends a tapped Salah once the Believer has sat 12 s at Normal", () => {
    const { state, at } = tapToFinalTashahhud(startSalah("fajr", NORMAL));
    expect(completesAt(state)).toBe(at + 12_000);
    expect(
      observe(state, { kind: "tick", at: at + 11_999 }).completed
    ).toBeFalsy();
    expect(
      observe(state, { kind: "tick", at: at + 12_000 }).completed
    ).toBeTruthy();
  });

  it("holds 8 s at Fast and 18 s at Slow", () => {
    const fast = tapToFinalTashahhud(startSalah("fajr", { pace: "fast" }));
    const slow = tapToFinalTashahhud(startSalah("fajr", { pace: "slow" }));
    expect(completesAt(fast.state)).toBe(fast.at + 8000);
    expect(completesAt(slow.state)).toBe(slow.at + 18_000);
  });

  it("lets the Believer end it early with a tap", () => {
    const { state, at } = tapToFinalTashahhud(startSalah("fajr", NORMAL));
    expect(
      observe(state, { kind: "advance", at: at + 1 }).completed
    ).toBeTruthy();
  });

  it("has no hold before the final Tashahhud", () => {
    expect(completesAt(startSalah("fajr", NORMAL))).toBeNull();
  });

  it("ignores everything once the Salah is done", () => {
    const { state, at } = tapToFinalTashahhud(startSalah("fajr", NORMAL));
    const done = observe(state, { kind: "advance", at: at + 1 });
    expect(observe(done, { kind: "back", at: at + 2 })).toBe(done);
  });
});

/** Readings every 100 ms of one Position, from `from` up to `to`. */
const hold = (
  position: Position | null,
  from: number,
  to: number
): Observation[] =>
  Array.from({ length: Math.floor((to - from) / 100) + 1 }, (_, index) => ({
    kind: "sensed",
    position,
    at: from + index * 100,
  }));

/** Sensed readings through one Rak'ah, ending in the second sujud. */
const rakah = (from: number): Observation[] => [
  ...hold("ruku", from, from + 1000),
  ...hold("itidal", from + 1100, from + 2000),
  ...hold("sujud", from + 2100, from + 3000),
  ...hold("jalsa", from + 3100, from + 4000),
  ...hold("sujud", from + 4100, from + 5000),
];

describe("sensed Positions", () => {
  it("counts a Position once it has held 0.8 s at Normal", () => {
    const start = startSalah("fajr", NORMAL);
    expect(currentStep(feed(start, hold("ruku", 0, 700))).position).toBe(
      "qiyam"
    );
    expect(currentStep(feed(start, hold("ruku", 0, 800))).position).toBe(
      "ruku"
    );
  });

  it("counts after 0.5 s at Fast and 1.2 s at Slow", () => {
    const fast = startSalah("fajr", { pace: "fast" });
    const slow = startSalah("fajr", { pace: "slow" });
    expect(currentStep(feed(fast, hold("ruku", 0, 500))).position).toBe("ruku");
    expect(currentStep(feed(slow, hold("ruku", 0, 1100))).position).toBe(
      "qiyam"
    );
    expect(currentStep(feed(slow, hold("ruku", 0, 1200))).position).toBe(
      "ruku"
    );
  });

  it("restarts the hold when the Position changes", () => {
    const state = feed(startSalah("fajr", NORMAL), [
      ...hold("ruku", 0, 500),
      ...hold("qiyam", 600, 700),
      ...hold("ruku", 800, 1500),
    ]);
    expect(currentStep(state).position).toBe("qiyam");
  });

  it("never moves backwards, and skips nothing", () => {
    const state = feed(startSalah("fajr", NORMAL), [
      ...hold("ruku", 0, 1000),
      ...hold("sujud", 1100, 3000),
      ...hold("qiyam", 3100, 5000),
    ]);
    expect(currentStep(state).position).toBe("ruku");
  });

  it("ignores frames with no recognised Position", () => {
    const state = feed(startSalah("fajr", NORMAL), hold(null, 0, 5000));
    expect(currentStep(state).position).toBe("qiyam");
  });

  it("rises for the next Rak'ah after a shorter hold", () => {
    const sujud = feed(startSalah("fajr", NORMAL), rakah(0));
    expect(currentStep(sujud)).toStrictEqual({
      rakah: 1,
      position: "sujud",
      final: false,
    });
    expect(currentStep(feed(sujud, hold("qiyam", 6000, 6400)))).toStrictEqual({
      rakah: 1,
      position: "sujud",
      final: false,
    });
    const risen = feed(sujud, [
      ...hold("qiyam", 6000, 6400),
      { kind: "sensed", position: "qiyam", at: 6450 },
    ]);
    expect(currentStep(risen)).toStrictEqual({
      rakah: 2,
      position: "qiyam",
      final: false,
    });
  });

  it("sits the middle Tashahhud after 3 s at Normal, then rises", () => {
    const sujud = feed(startSalah("dhuhr", NORMAL), [
      ...rakah(0),
      ...hold("qiyam", 5100, 6000),
      ...rakah(6100),
    ]);
    const sitting = feed(sujud, hold("jalsa", 12_000, 14_900));
    expect(currentStep(sitting).position).toBe("sujud");
    const tashahhud = feed(sitting, hold("tashahhud", 15_000, 15_000));
    expect(currentStep(tashahhud)).toStrictEqual({
      rakah: 2,
      position: "tashahhud",
      final: false,
    });
    expect(
      currentStep(feed(tashahhud, hold("qiyam", 20_000, 20_500)))
    ).toStrictEqual({ rakah: 3, position: "qiyam", final: false });
  });

  it("ends the Salah after sitting the final Tashahhud for 12 s at Normal", () => {
    const sujud = feed(startSalah("fajr", NORMAL), [
      ...rakah(0),
      ...hold("qiyam", 5100, 6000),
      ...rakah(6100),
    ]);
    const final = feed(sujud, hold("jalsa", 12_000, 15_000));
    expect(currentStep(final)).toStrictEqual({
      rakah: 2,
      position: "tashahhud",
      final: true,
    });
    expect(completesAt(final)).toBe(24_000);
    expect(
      feed(final, hold("tashahhud", 15_100, 23_900)).completed
    ).toBeFalsy();
    expect(
      feed(final, hold("tashahhud", 15_100, 24_000)).completed
    ).toBeTruthy();
  });

  it("keeps the final hold through a misread frame, but not a real rise", () => {
    const sujud = feed(startSalah("fajr", NORMAL), [
      ...rakah(0),
      ...hold("qiyam", 5100, 6000),
      ...rakah(6100),
    ]);
    const final = feed(sujud, hold("jalsa", 12_000, 15_000));
    const flicker = feed(final, [
      ...hold("qiyam", 16_000, 16_300),
      ...hold("jalsa", 16_400, 24_000),
    ]);
    expect(flicker.completed).toBeTruthy();

    const rose = feed(final, [
      ...hold("qiyam", 16_000, 17_000),
      ...hold("jalsa", 17_100, 24_000),
    ]);
    expect(rose.completed).toBeFalsy();
    expect(completesAt(rose)).toBe(29_100);
  });
});

describe("confirmed Positions (Mat mode)", () => {
  it("jumps to the next sujud: the Believer passed through the rest", () => {
    const state = observe(startSalah("fajr", NORMAL), {
      kind: "confirmed",
      position: "sujud",
      at: 0,
    });
    expect(currentStep(state)).toStrictEqual({
      rakah: 1,
      position: "sujud",
      final: false,
    });
  });

  it("never jumps past a Tashahhud", () => {
    const sujuds = feed(
      startSalah("dhuhr", NORMAL),
      Array.from({ length: 4 }, (_, index) => ({
        kind: "confirmed",
        position: "sujud",
        at: index * 1000,
      }))
    );
    expect(currentStep(sujuds)).toStrictEqual({
      rakah: 2,
      position: "sujud",
      final: false,
    });
    const blocked = observe(sujuds, {
      kind: "confirmed",
      position: "sujud",
      at: 5000,
    });
    expect(blocked).toBe(sujuds);
    const tashahhud = observe(sujuds, {
      kind: "confirmed",
      position: "tashahhud",
      at: 5000,
    });
    expect(
      currentStep(
        observe(tashahhud, { kind: "confirmed", position: "sujud", at: 9000 })
      )
    ).toStrictEqual({ rakah: 3, position: "sujud", final: false });
  });
});
