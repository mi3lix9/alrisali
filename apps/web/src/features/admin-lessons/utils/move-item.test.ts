import { describe, expect, it } from "vitest";

import { moveItem } from "./move-item";

describe(moveItem, () => {
  it("moves an item up or down without changing the original", () => {
    const ids = ["a", "b", "c"];
    expect(moveItem(ids, 2, 1)).toStrictEqual(["a", "c", "b"]);
    expect(moveItem(ids, 0, 1)).toStrictEqual(["b", "a", "c"]);
    expect(ids).toStrictEqual(["a", "b", "c"]);
  });
});
