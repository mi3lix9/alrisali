import { describe, expect, it } from "vitest";

import type { FeatureEntry } from "./features";
import type { HijriDate } from "./hijri";
import {
  arrangedShortcuts,
  DEFAULT_SHORTCUT_LAYOUT,
  homeShortcuts,
  moveShortcut,
  readShortcutLayout,
  setShortcutShown,
} from "./home-shortcuts";
import type { ShortcutLayout } from "./home-shortcuts";

const REGISTRY = [
  { id: "home", tab: true },
  { id: "quran", area: "quran", shortcut: "shown" },
  { id: "qibla", area: "prayer", shortcut: "shown" },
  { id: "lessons", area: "library", shortcut: "hidden" },
  {
    id: "imsakiyya",
    area: "seasonal",
    shortcut: "shown",
    window: { start: { month: 9, day: 1 }, end: { month: 9, day: 30 } },
  },
  { id: "tasbih", area: "worship", shortcut: "shown" },
] as const satisfies readonly FeatureEntry[];

type Id = (typeof REGISTRY)[number]["id"];

const SHAWWAL_2: HijriDate = { year: 1448, month: 10, day: 2 };
const RAMADAN_10: HijriDate = { year: 1448, month: 9, day: 10 };

const onHome = (layout: ShortcutLayout<Id>, today = SHAWWAL_2) =>
  homeShortcuts(REGISTRY, layout, today).map((feature) => feature.id);

describe(homeShortcuts, () => {
  it("shows the registry's default shortcuts in registry order until the Believer arranges them", () => {
    expect(onHome(DEFAULT_SHORTCUT_LAYOUT)).toStrictEqual([
      "quran",
      "qibla",
      "tasbih",
    ]);
  });

  it("shows a seasonal shortcut only in its window", () => {
    expect(onHome(DEFAULT_SHORTCUT_LAYOUT, RAMADAN_10)).toStrictEqual([
      "quran",
      "qibla",
      "imsakiyya",
      "tasbih",
    ]);
  });

  it("follows the Believer's order and leaves out what they hid", () => {
    expect(
      onHome({
        order: ["tasbih", "lessons", "quran", "qibla", "imsakiyya"],
        hidden: ["qibla"],
      })
    ).toStrictEqual(["tasbih", "lessons", "quran"]);
  });

  it("puts a shortcut added in a later release after the arranged ones, with its default", () => {
    expect(
      onHome({ order: ["tasbih", "quran"], hidden: ["quran"] })
    ).toStrictEqual(["tasbih", "qibla"]);
  });
});

describe(setShortcutShown, () => {
  it("shows a shortcut that is hidden by default, at its place", () => {
    const layout = setShortcutShown(
      REGISTRY,
      DEFAULT_SHORTCUT_LAYOUT,
      "lessons",
      true
    );

    expect(onHome(layout)).toStrictEqual([
      "quran",
      "qibla",
      "lessons",
      "tasbih",
    ]);
  });

  it("hides a shortcut and keeps the others in order", () => {
    const layout = setShortcutShown(
      REGISTRY,
      DEFAULT_SHORTCUT_LAYOUT,
      "qibla",
      false
    );

    expect(onHome(layout)).toStrictEqual(["quran", "tasbih"]);
    expect(
      arrangedShortcuts(REGISTRY, layout).map(({ feature, shown }) => [
        feature.id,
        shown,
      ])
    ).toStrictEqual([
      ["quran", true],
      ["qibla", false],
      ["lessons", false],
      ["imsakiyya", true],
      ["tasbih", true],
    ]);
  });
});

describe(moveShortcut, () => {
  it("moves a shortcut to where the Believer dropped it", () => {
    const layout = moveShortcut(REGISTRY, DEFAULT_SHORTCUT_LAYOUT, 4, 0);

    expect(onHome(layout)).toStrictEqual(["tasbih", "quran", "qibla"]);
  });

  it("moves a shortcut down past the others", () => {
    const layout = moveShortcut(REGISTRY, DEFAULT_SHORTCUT_LAYOUT, 0, 2);

    expect(onHome(layout)).toStrictEqual(["qibla", "quran", "tasbih"]);
  });

  it("keeps hidden shortcuts hidden when moved", () => {
    const hidden = setShortcutShown(
      REGISTRY,
      DEFAULT_SHORTCUT_LAYOUT,
      "quran",
      false
    );

    expect(onHome(moveShortcut(REGISTRY, hidden, 0, 4))).toStrictEqual([
      "qibla",
      "tasbih",
    ]);
  });

  it("clamps a drop past the end to the last place", () => {
    const layout = moveShortcut(REGISTRY, DEFAULT_SHORTCUT_LAYOUT, 0, 99);

    expect(onHome(layout)).toStrictEqual(["qibla", "tasbih", "quran"]);
  });
});

describe(readShortcutLayout, () => {
  it("drops ids it does not know, features that cannot be shortcuts, and repeats", () => {
    expect(
      readShortcutLayout(REGISTRY, {
        order: ["future", "tasbih", "home", "quran", "tasbih", 7],
        hidden: ["quran", "future", "qibla"],
      })
    ).toStrictEqual({ order: ["tasbih", "quran"], hidden: ["quran"] });
  });

  it("reads anything that is not a layout as nothing arranged", () => {
    expect(readShortcutLayout(REGISTRY, "tasbih")).toBeNull();
    expect(readShortcutLayout(REGISTRY, null)).toBeNull();
    expect(readShortcutLayout(REGISTRY, { order: ["quran"] })).toBeNull();
  });
});
