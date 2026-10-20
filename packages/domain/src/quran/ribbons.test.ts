import { describe, expect, it } from "vitest";

import { findAyah } from "./mushaf";
import {
  clearRibbon,
  emptyRibbons,
  moveRibbon,
  normaliseRibbons,
  renameRibbon,
  ribbonColorsByAyah,
  RIBBON_COLORS,
  RIBBON_NAME_MAX,
} from "./ribbons";

const at = (minute: number) => new Date(`2026-10-16T10:0${minute}:00.000Z`);
const find = (ribbons: ReturnType<typeof emptyRibbons>, color: string) =>
  ribbons.find((ribbon) => ribbon.color === color);

describe("Bookmark Ribbons", () => {
  it("are exactly six, all unused to begin with", () => {
    const ribbons = emptyRibbons();
    expect(ribbons.map((ribbon) => ribbon.color)).toStrictEqual([
      ...RIBBON_COLORS,
    ]);
    expect(RIBBON_COLORS).toHaveLength(6);
    expect(ribbons.every((ribbon) => ribbon.ayah === null)).toBeTruthy();
  });

  it("move to a new ayah when the colour is set again", () => {
    const first = moveRibbon(emptyRibbons(), "red", "2:255", at(1));
    const second = moveRibbon(first, "red", "112:1", at(2));

    expect(find(second, "red")?.ayah).toBe("112:1");
    expect(second.filter((ribbon) => ribbon.ayah !== null)).toHaveLength(1);
    expect(second).toHaveLength(6);
  });

  it("let another colour stay put when one moves", () => {
    const ribbons = moveRibbon(
      moveRibbon(emptyRibbons(), "green", "1:1", at(1)),
      "red",
      "2:255",
      at(2)
    );

    expect(find(ribbons, "green")?.ayah).toBe("1:1");
  });

  it("refuse an ayah the mushaf does not have", () => {
    expect(() => moveRibbon(emptyRibbons(), "red", "115:1", at(1))).toThrow(
      "No ayah 115:1"
    );
  });

  it("come off their ayah and keep their name", () => {
    const named = renameRibbon(
      moveRibbon(emptyRibbons(), "blue", "36:1", at(1)),
      "blue",
      "Ya-Sin",
      at(2)
    );
    const cleared = clearRibbon(named, "blue", at(3));

    expect(find(cleared, "blue")).toMatchObject({
      ayah: null,
      name: "Ya-Sin",
    });
  });

  it("are renamed: trimmed, capped, and blank restores the default", () => {
    const named = renameRibbon(emptyRibbons(), "red", "  Memorising  ", at(1));
    expect(find(named, "red")?.name).toBe("Memorising");

    const long = renameRibbon(named, "red", "x".repeat(100), at(2));
    expect(find(long, "red")?.name).toHaveLength(RIBBON_NAME_MAX);

    const blank = renameRibbon(long, "red", "   ", at(3));
    expect(find(blank, "red")?.name).toBeNull();
  });

  it("are completed to six from stored rows, dropping unknown ayat", () => {
    const stored = normaliseRibbons([
      { color: "green", name: "Dua", ayah: "2:255", updatedAt: "x" },
      { color: "blue", name: null, ayah: "999:1", updatedAt: "y" },
    ]);

    expect(stored).toHaveLength(6);
    expect(find(stored, "green")).toMatchObject({
      ayah: "2:255",
      name: "Dua",
    });
    expect(find(stored, "blue")?.ayah).toBeNull();
    expect(findAyah("999:1")).toBeUndefined();
  });

  it("list the colours on each ayah, most recent first", () => {
    const ribbons = moveRibbon(
      moveRibbon(
        moveRibbon(emptyRibbons(), "red", "2:255", at(1)),
        "blue",
        "2:255",
        at(2)
      ),
      "green",
      "1:1",
      at(3)
    );
    const byAyah = ribbonColorsByAyah(ribbons);

    expect(byAyah.get("2:255")).toStrictEqual(["blue", "red"]);
    expect(byAyah.get("1:1")).toStrictEqual(["green"]);
    expect(byAyah.has("1:2")).toBeFalsy();
  });
});
