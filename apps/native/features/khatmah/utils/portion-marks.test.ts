import { describe, expect, it } from "vitest";

import { portionMarks } from "./portion-marks";

describe(portionMarks, () => {
  it("marks the start and the end of the portion", () => {
    const marks = portionMarks({ from: "2:1", to: "2:141" });
    expect(marks.get("2:1")).toStrictEqual([
      { kind: "khatmah-portion", edge: "start" },
    ]);
    expect(marks.get("2:141")).toStrictEqual([
      { kind: "khatmah-portion", edge: "end" },
    ]);
    expect(marks.size).toBe(2);
  });

  it("gives a one-ayah portion both marks, and no portion none", () => {
    expect(portionMarks({ from: "1:1", to: "1:1" }).get("1:1")).toHaveLength(2);
    expect(portionMarks(null).size).toBe(0);
  });
});
