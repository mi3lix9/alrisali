import { describe, expect, it } from "vitest";

import {
  COMPANION_THEMES,
  companionLevel,
  companionStage,
  levelReached,
  XP_PER_LEVEL,
  xpAward,
} from "./companion";
import type { XpEvent } from "./companion";

const EVENTS: XpEvent[] = [
  { kind: "salah", date: "2026-10-16", salah: "fajr" },
  { kind: "act", programId: "muharram", actId: "ziyarah", date: "2026-10-16" },
  { kind: "habit", habitId: "quran-page", date: "2026-10-16" },
  { kind: "dhikr-session", sessionId: "6f1c0b1e-3a43-4c38-9a9e-6f0c3c2b8a10" },
  { kind: "reading", supplicationId: "sahifa-1", date: "2026-10-16" },
  { kind: "lesson", lessonId: "aqeedah-1" },
];

describe("Companion XP awards", () => {
  it("awards XP for each kind of devotion", () => {
    for (const event of EVENTS) {
      expect(xpAward(event).xp).toBeGreaterThan(0);
    }
  });

  it("keys an award by what makes the event the same one on every device", () => {
    expect(EVENTS.map((event) => xpAward(event).key)).toStrictEqual([
      "salah:2026-10-16:fajr",
      "act:muharram:ziyarah:2026-10-16",
      "habit:quran-page:2026-10-16",
      "dhikr-session:6f1c0b1e-3a43-4c38-9a9e-6f0c3c2b8a10",
      "reading:sahifa-1:2026-10-16",
      "lesson:aqeedah-1",
    ]);
  });

  it("gives the same event the same key however often it is heard", () => {
    const fajr: XpEvent = { kind: "salah", date: "2026-10-16", salah: "fajr" };

    expect(xpAward({ ...fajr })).toStrictEqual(xpAward(fajr));
  });

  it("gives a different date, Salah or item a different key", () => {
    const keys = [
      { kind: "salah", date: "2026-10-16", salah: "fajr" },
      { kind: "salah", date: "2026-10-17", salah: "fajr" },
      { kind: "salah", date: "2026-10-16", salah: "dhuhr" },
      { kind: "habit", habitId: "a", date: "2026-10-16" },
      { kind: "habit", habitId: "a", date: "2026-10-17" },
      { kind: "act", programId: "p", actId: "a", date: "2026-10-16" },
      { kind: "act", programId: "q", actId: "a", date: "2026-10-16" },
    ].map((event) => xpAward(event as XpEvent).key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("cannot be confused by an id that contains the separator", () => {
    const one = xpAward({
      kind: "act",
      programId: "a:b",
      actId: "c",
      date: "2026-10-16",
    });
    const other = xpAward({
      kind: "act",
      programId: "a",
      actId: "b:c",
      date: "2026-10-16",
    });

    expect(one.key).not.toBe(other.key);
  });

  it("rejects an event with a date that is not a calendar day", () => {
    expect(() =>
      xpAward({ kind: "salah", date: "16/10/2026", salah: "fajr" })
    ).toThrow("date");
  });
});

describe("Companion level", () => {
  it("starts at level 1 with no XP", () => {
    expect(companionLevel(0)).toStrictEqual({
      level: 1,
      xpIntoLevel: 0,
      xpToNextLevel: XP_PER_LEVEL,
      fraction: 0,
    });
  });

  it(`reaches the next level every ${XP_PER_LEVEL} XP`, () => {
    expect(companionLevel(XP_PER_LEVEL - 1).level).toBe(1);
    expect(companionLevel(XP_PER_LEVEL)).toStrictEqual({
      level: 2,
      xpIntoLevel: 0,
      xpToNextLevel: XP_PER_LEVEL,
      fraction: 0,
    });
    expect(companionLevel(XP_PER_LEVEL * 2 + 25)).toStrictEqual({
      level: 3,
      xpIntoLevel: 25,
      xpToNextLevel: XP_PER_LEVEL - 25,
      fraction: 0.25,
    });
  });

  it("reports the level reached when XP crosses a threshold, and only then", () => {
    expect(levelReached(XP_PER_LEVEL - 10, XP_PER_LEVEL)).toBe(2);
    expect(levelReached(XP_PER_LEVEL * 3 - 5, XP_PER_LEVEL * 3 + 15)).toBe(4);
    expect(levelReached(10, 20)).toBeNull();
    expect(levelReached(20, 20)).toBeNull();
  });
});

describe("Companion stage", () => {
  it("grows a Garden from a seedling", () => {
    expect(
      [1, 2, 3, 4, 5, 6, 8, 9, 30].map((level) =>
        companionStage("garden", level)
      )
    ).toStrictEqual([
      "seedling",
      "sprout",
      "sprout",
      "bloom",
      "bloom",
      "tree",
      "tree",
      "garden",
      "garden",
    ]);
  });

  it("walks a Traveler from seeker to travelling spirit", () => {
    expect(
      [1, 2, 3, 4, 5, 6, 8, 9, 30].map((level) =>
        companionStage("traveler", level)
      )
    ).toStrictEqual([
      "seeker",
      "wayfarer",
      "wayfarer",
      "pilgrim",
      "pilgrim",
      "guidingLight",
      "guidingLight",
      "travellingSpirit",
      "travellingSpirit",
    ]);
  });

  it("offers both themes, the Traveler first", () => {
    expect(COMPANION_THEMES).toStrictEqual(["traveler", "garden"]);
  });
});
