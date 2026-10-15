import { describe, expect, it } from "vitest";

import { readHiddenTabs, setTabVisible, visibleTabs } from "./tabs";

describe("tab visibility", () => {
  it("shows every tab by default, Home first", () => {
    expect(visibleTabs([])).toStrictEqual([
      "home",
      "prayer",
      "library",
      "worship",
      "tasbih",
    ]);
  });

  it("hides the tabs the Believer turned off and keeps the rest in order", () => {
    const hidden = setTabVisible(
      setTabVisible([], "worship", false),
      "prayer",
      false
    );

    expect(visibleTabs(hidden)).toStrictEqual(["home", "library", "tasbih"]);
  });

  it("always shows Home, even when asked to hide it", () => {
    const hidden = setTabVisible([], "home", false);

    expect(hidden).toStrictEqual([]);
    expect(visibleTabs(["home", "prayer"])).toStrictEqual([
      "home",
      "library",
      "worship",
      "tasbih",
    ]);
  });

  it("shows a hidden tab again when turned back on", () => {
    const hidden = setTabVisible(["prayer", "tasbih"], "prayer", true);

    expect(visibleTabs(hidden)).toStrictEqual([
      "home",
      "prayer",
      "library",
      "worship",
    ]);
  });

  it("hiding an already hidden tab leaves one entry", () => {
    expect(setTabVisible(["prayer"], "prayer", false)).toStrictEqual([
      "prayer",
    ]);
  });

  it("ignores stored entries that are not tabs, and Home", () => {
    expect(
      readHiddenTabs(["prayer", "quran", 7, "home", "prayer"])
    ).toStrictEqual(["prayer"]);
    expect(readHiddenTabs("prayer")).toStrictEqual([]);
  });
});
