import { describe, expect, it } from "vitest";

import { openTasbihDetailsSchema, tapOpenTasbih } from "./open-tasbih";

describe("Open Tasbih", () => {
  it("counts a tap with light feedback when there is no target", () => {
    expect(tapOpenTasbih({ count: 41, target: null })).toStrictEqual({
      count: 42,
      feedback: "tap",
    });
  });

  it("signals the target on the tap that reaches it", () => {
    expect(tapOpenTasbih({ count: 32, target: 33 })).toStrictEqual({
      count: 33,
      feedback: "target",
    });
  });

  it("signals the target once, then keeps counting past it", () => {
    const taps = [];
    let count = 0;
    for (let tap = 0; tap < 5; tap += 1) {
      const outcome = tapOpenTasbih({ count, target: 3 });
      taps.push(outcome.feedback);
      ({ count } = outcome);
    }

    expect(taps).toStrictEqual(["tap", "tap", "target", "tap", "tap"]);
    expect(count).toBe(5);
  });

  it("signals a target of one on the first tap", () => {
    expect(tapOpenTasbih({ count: 0, target: 1 }).feedback).toBe("target");
  });

  it("takes a name, an optional target and optional notes", () => {
    expect(
      openTasbihDetailsSchema.parse({
        name: "  Salawat ",
        target: 100,
        notes: " After Fajr ",
      })
    ).toStrictEqual({ name: "Salawat", target: 100, notes: "After Fajr" });
    expect(
      openTasbihDetailsSchema.parse({ name: "Istighfar", target: null })
    ).toStrictEqual({ name: "Istighfar", target: null, notes: null });
  });

  it("treats blank notes as none", () => {
    expect(
      openTasbihDetailsSchema.parse({
        name: "Salawat",
        target: null,
        notes: "  ",
      }).notes
    ).toBeNull();
  });

  it("rejects a blank name and a target that is not a positive whole number", () => {
    expect(
      openTasbihDetailsSchema.safeParse({ name: " ", target: null }).success
    ).toBeFalsy();
    expect(
      openTasbihDetailsSchema.safeParse({ name: "Salawat", target: 0 }).success
    ).toBeFalsy();
    expect(
      openTasbihDetailsSchema.safeParse({ name: "Salawat", target: 2.5 })
        .success
    ).toBeFalsy();
  });
});
