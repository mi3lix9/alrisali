import { describe, expect, it } from "vitest";

import {
  canRotateReader,
  pagesOfSpread,
  shownPageOfSpread,
  showsSpread,
  SPREAD_COUNT,
  spreadOfPage,
} from "./spread";

describe("two-page spread", () => {
  it("shows a spread only on a wide landscape screen", () => {
    expect(showsSpread({ width: 1280, height: 800 })).toBeTruthy();
    expect(showsSpread({ width: 800, height: 1280 })).toBeFalsy();
    expect(showsSpread({ width: 850, height: 400 })).toBeFalsy();
  });

  it("lets only tablets and unfolded foldables rotate the reader", () => {
    expect(canRotateReader({ width: 800, height: 1280 })).toBeTruthy();
    expect(canRotateReader({ width: 1280, height: 800 })).toBeTruthy();
    expect(canRotateReader({ width: 390, height: 844 })).toBeFalsy();
  });

  it("pairs page 1 with 2, and the right page leads", () => {
    expect(pagesOfSpread(1)).toStrictEqual([1, 2]);
    expect(pagesOfSpread(2)).toStrictEqual([3, 4]);
    expect(pagesOfSpread(SPREAD_COUNT)).toStrictEqual([603, 604]);
  });

  it("maps pages to spreads and back to the right page", () => {
    expect(spreadOfPage(1)).toBe(1);
    expect(spreadOfPage(2)).toBe(1);
    expect(spreadOfPage(3)).toBe(2);
    expect(shownPageOfSpread(spreadOfPage(604))).toBe(603);
  });
});
