import { describe, expect, it } from "vitest";

import {
  restoreTasbihAlZahra,
  TASBIH_AL_ZAHRA_START,
  tapTasbihAlZahra,
} from "./tasbih-al-zahra";
import type {
  TasbihAlZahraProgress,
  TasbihAlZahraTap,
} from "./tasbih-al-zahra";

/** Taps `times` times from `progress`, keeping every tap's outcome. */
const tapRepeatedly = (
  progress: TasbihAlZahraProgress,
  times: number
): TasbihAlZahraTap[] => {
  const taps: TasbihAlZahraTap[] = [];
  let current = progress;
  for (let tap = 0; tap < times; tap += 1) {
    const outcome = tapTasbihAlZahra(current);
    taps.push(outcome);
    current = outcome.progress;
  }
  return taps;
};

describe("Tasbih al-Zahra", () => {
  it("starts on Allahu Akbar with nothing counted", () => {
    expect(TASBIH_AL_ZAHRA_START).toStrictEqual({ step: 0, count: 0 });
  });

  it("counts a tap with light feedback", () => {
    expect(tapTasbihAlZahra({ step: 0, count: 0 })).toStrictEqual({
      progress: { step: 0, count: 1 },
      feedback: "tap",
      dhikrSessionCount: null,
    });
  });

  it("auto-advances after Allahu Akbar ×34 and Alhamdulillah ×33, with stronger feedback", () => {
    const taps = tapRepeatedly(TASBIH_AL_ZAHRA_START, 67);

    expect(taps[33]).toStrictEqual({
      progress: { step: 1, count: 0 },
      feedback: "step",
      dhikrSessionCount: null,
    });
    expect(taps[66]).toStrictEqual({
      progress: { step: 2, count: 0 },
      feedback: "step",
      dhikrSessionCount: null,
    });
  });

  it("yields exactly one Dhikr Session of 100 for a full round, then resets", () => {
    const taps = tapRepeatedly(TASBIH_AL_ZAHRA_START, 100);

    const sessions = taps.filter((tap) => tap.dhikrSessionCount !== null);
    expect(sessions).toStrictEqual([
      {
        progress: { step: 0, count: 0 },
        feedback: "round",
        dhikrSessionCount: 100,
      },
    ]);
    expect(taps.at(-1)).toBe(sessions[0]);
    expect(taps.filter((tap) => tap.feedback === "step")).toHaveLength(2);
  });

  it("starts a second round cleanly after the first", () => {
    const taps = tapRepeatedly(TASBIH_AL_ZAHRA_START, 200);

    expect(
      taps.flatMap((tap) =>
        tap.dhikrSessionCount === null ? [] : [tap.dhikrSessionCount]
      )
    ).toStrictEqual([100, 100]);
    expect(taps.at(-1)?.progress).toStrictEqual({ step: 0, count: 0 });
  });

  it("restores saved progress, and starts over from anything it cannot trust", () => {
    expect(restoreTasbihAlZahra({ step: 2, count: 32 })).toStrictEqual({
      step: 2,
      count: 32,
    });
    expect(restoreTasbihAlZahra({ step: 0, count: 34 })).toStrictEqual(
      TASBIH_AL_ZAHRA_START
    );
    expect(restoreTasbihAlZahra({ step: 3, count: 0 })).toStrictEqual(
      TASBIH_AL_ZAHRA_START
    );
    expect(restoreTasbihAlZahra({ step: 1, count: -1 })).toStrictEqual(
      TASBIH_AL_ZAHRA_START
    );
    expect(restoreTasbihAlZahra({ step: 1.5, count: 2 })).toStrictEqual(
      TASBIH_AL_ZAHRA_START
    );
  });
});
