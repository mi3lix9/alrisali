import { describe, expect, it } from "vitest";

import { recordSearch, SEARCH_HISTORY_LIMIT } from ".";

describe(recordSearch, () => {
  it("puts the latest search first", () => {
    expect(recordSearch(["2:255"], "الكهف")).toStrictEqual(["الكهف", "2:255"]);
  });

  it("keeps only the last ten searches", () => {
    let history: string[] = [];
    for (let number = 1; number <= 12; number += 1) {
      history = recordSearch(history, `1:${number}`);
    }
    expect(SEARCH_HISTORY_LIMIT).toBe(10);
    expect(history).toHaveLength(SEARCH_HISTORY_LIMIT);
    expect(history[0]).toBe("1:12");
    expect(history.at(-1)).toBe("1:3");
  });

  it("moves a repeated search up instead of listing it twice", () => {
    expect(
      recordSearch(["a", "Baqarah 255", "b"], "  baqarah   255 ")
    ).toStrictEqual(["baqarah 255", "a", "b"]);
  });

  it("ignores a blank search", () => {
    const history = ["2:255"];
    expect(recordSearch(history, "   ")).toBe(history);
  });
});
