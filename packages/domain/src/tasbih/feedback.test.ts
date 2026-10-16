import { describe, expect, it } from "vitest";

import { tasbihFeedback } from "./feedback";

describe(tasbihFeedback, () => {
  it("plays a sound and a vibration in sound and haptic mode", () => {
    expect(tasbihFeedback("sound-and-haptic")).toStrictEqual({
      sound: true,
      haptic: true,
    });
  });

  it("only vibrates in haptic mode", () => {
    expect(tasbihFeedback("haptic")).toStrictEqual({
      sound: false,
      haptic: true,
    });
  });

  it("makes no sound and no vibration in silent mode", () => {
    expect(tasbihFeedback("silent")).toStrictEqual({
      sound: false,
      haptic: false,
    });
  });
});
