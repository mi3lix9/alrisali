import { describe, expect, it } from "vitest";

import { createReciteMatcher } from "./matcher";
import {
  initialProgress,
  isAdvancing,
  isListening,
  PACE_MS,
  reciteStep,
  usesVoice,
  withoutVoice,
} from "./progress";
import type { ReciteEvent, ReciteProgress } from "./progress";

const run = (progress: ReciteProgress, events: ReciteEvent[]) => {
  let reached = progress;
  for (const event of events) {
    reached = reciteStep(reached, event);
  }
  return reached;
};

const tick: ReciteEvent = { type: "tick" };

describe("Recite-Along by holding", () => {
  const start = initialProgress("hold", 3);

  it("writes the first word as soon as the Believer presses", () => {
    expect(run(start, [{ type: "press" }]).count).toBe(1);
  });

  it("writes a word per tick while held, and stops on release", () => {
    const held = run(start, [{ type: "press" }, tick]);
    const released = run(held, [{ type: "release" }, tick]);

    expect(held.count).toBe(2);
    expect(isAdvancing(held)).toBeTruthy();
    expect(released.count).toBe(2);
    expect(isAdvancing(released)).toBeFalsy();
  });

  it("does not move without a hold", () => {
    expect(run(start, [tick, tick]).count).toBe(0);
  });

  it("stops at the last word", () => {
    const done = run(start, [{ type: "press" }, tick, tick, tick, tick]);

    expect(done.count).toBe(3);
    expect(isAdvancing(done)).toBeFalsy();
  });
});

describe("Recite-Along at a timed pace", () => {
  const start = initialProgress("auto", 3);

  it("writes a word per tick on its own", () => {
    expect(isAdvancing(start)).toBeTruthy();
    expect(run(start, [tick, tick]).count).toBe(2);
  });

  it("pauses while held and carries on when released", () => {
    const held = run(start, [tick, { type: "press" }, tick]);

    expect(held.count).toBe(1);
    expect(run(held, [{ type: "release" }, tick]).count).toBe(2);
  });

  it("stays paused until the Believer resumes", () => {
    const paused = run(start, [{ type: "togglePause" }, tick]);

    expect(paused.count).toBe(0);
    expect(isAdvancing(paused)).toBeFalsy();
    expect(run(paused, [{ type: "togglePause" }, tick]).count).toBe(1);
  });

  it("is slower at slow pace than at fast", () => {
    expect(PACE_MS.slow).toBeGreaterThan(PACE_MS.normal);
    expect(PACE_MS.normal).toBeGreaterThan(PACE_MS.fast);
  });
});

describe("restarting and switching mode", () => {
  it("restart goes back to the first word and clears pause and hold", () => {
    const progressed = run(initialProgress("auto", 5), [
      tick,
      tick,
      { type: "togglePause" },
      { type: "press" },
    ]);

    expect(run(progressed, [{ type: "restart" }])).toStrictEqual(
      initialProgress("auto", 5)
    );
  });

  it("switching mode keeps the place and clears pause", () => {
    const paused = run(initialProgress("auto", 5), [
      tick,
      { type: "togglePause" },
    ]);
    const switched = run(paused, [{ type: "setMode", mode: "hold" }]);

    expect(switched).toStrictEqual({
      ...initialProgress("hold", 5),
      count: 1,
    });
  });
});

describe("Recite-Along by voice", () => {
  const start = initialProgress("voice", 4);

  it("moves only with what is heard, never on its own or by touch", () => {
    const touched = run(start, [tick, { type: "press" }, tick]);

    expect(isAdvancing(start)).toBeFalsy();
    expect(touched.count).toBe(0);
    expect(run(touched, [{ type: "heard", count: 2 }]).count).toBe(2);
  });

  it("never moves backwards on a shorter transcript, and stops at the end", () => {
    const heard = run(start, [
      { type: "heard", count: 3 },
      { type: "heard", count: 1 },
    ]);

    expect(heard.count).toBe(3);
    expect(run(heard, [{ type: "heard", count: 9 }]).count).toBe(4);
  });

  it("ignores speech in the touch-only methods", () => {
    expect(
      run(initialProgress("hold", 4), [{ type: "heard", count: 2 }]).count
    ).toBe(0);
    expect(
      run(initialProgress("auto", 4), [{ type: "heard", count: 2 }]).count
    ).toBe(0);
  });

  it("pausing stops listening", () => {
    expect(isListening(start)).toBeTruthy();
    expect(isListening(run(start, [{ type: "togglePause" }]))).toBeFalsy();
    expect(isListening(run(start, [{ type: "heard", count: 4 }]))).toBeFalsy();
    expect(isListening(initialProgress("hold", 4))).toBeFalsy();
  });
});

describe("Recite-Along by voice and touch together", () => {
  const start = initialProgress("hybrid", 5);

  it("advances by holding as well as by voice, sharing one place", () => {
    const words = ["بسم", "الله", "الرحمن", "الرحيم", "الحمد"];
    const matcher = createReciteMatcher(words);

    const held = run(start, [{ type: "press" }, tick, { type: "release" }]);
    matcher.seek(held.count);
    const heard = run(held, [
      { type: "heard", count: matcher.feed("الرحمن الرحيم", false) },
    ]);

    expect(held.count).toBe(2);
    expect(isListening(held)).toBeTruthy();
    expect(heard.count).toBe(4);
  });

  it("restart sends voice back to the first word too", () => {
    const words = ["بسم", "الله", "الرحمن"];
    const matcher = createReciteMatcher(words);
    const heard = run(start, [
      { type: "heard", count: matcher.feed("بسم الله", true) },
    ]);
    const restarted = run(heard, [{ type: "restart" }]);
    matcher.seek(restarted.count);

    expect(restarted.count).toBe(0);
    expect(matcher.feed("بسم", false)).toBe(1);
  });
});

describe("falling back from voice", () => {
  it("uses holding instead of the voice methods", () => {
    expect(withoutVoice("voice")).toBe("hold");
    expect(withoutVoice("hybrid")).toBe("hold");
    expect(withoutVoice("auto")).toBe("auto");
    expect(usesVoice("hybrid")).toBeTruthy();
    expect(usesVoice("hold")).toBeFalsy();
  });
});
