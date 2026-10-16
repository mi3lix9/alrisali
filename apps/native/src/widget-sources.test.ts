import type { Khatmah, KhatmahLog } from "@alrisali/domain/khatmah";
import { findAyah, verseOfTheDay } from "@alrisali/domain/quran";
import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { WIDGET_LINKS, widgetSources } from "./widget-sources";

const START = Temporal.PlainDate.from("2026-10-15");
const TODAY = Temporal.PlainDate.from("2026-10-16");

const khatmah = (id: string, startDate = START): Khatmah => ({
  id,
  plan: { kind: "suggested" },
  startDate,
  reminderAt: null,
  createdAt: 0,
});

const sources = (
  khatmahs: Khatmah[] = [],
  logs: KhatmahLog[] = [],
  lastRead: string | null = null
) => widgetSources({ khatmahs, logs, lastRead });

describe(widgetSources, () => {
  it("gives the Verse of the Day the Home card shows", () => {
    const { verse } = sources();
    const expected = verseOfTheDay(TODAY);
    expect(verse(TODAY)).toStrictEqual({
      key: expected.key,
      surah: expected.surah,
      ayah: expected.ayah,
      text: expected.text,
    });
  });

  it("gives the Last-Read Ayah with its page, or none", () => {
    const ayah = findAyah("2:255");
    expect(sources([], [], "2:255").lastRead).toStrictEqual({
      surah: 2,
      ayah: 255,
      page: ayah?.page,
    });
    expect(sources().lastRead).toBeNull();
    expect(sources([], [], "999:1").lastRead).toBeNull();
  });

  it("reads the newest Khatmah not yet finished, as the Khatmah feature does", () => {
    const older = khatmah("older");
    const newer = khatmah("newer", Temporal.PlainDate.from("2026-10-16"));
    expect(sources([older, newer]).khatmah(TODAY)?.id).toBe("newer");
    const finished: KhatmahLog[] = Array.from({ length: 30 }, (_, index) => ({
      khatmahId: "newer",
      session: index + 1,
      date: TODAY,
    }));
    expect(sources([older, newer], finished).khatmah(TODAY)?.id).toBe("older");
    expect(sources([newer], finished).khatmah(TODAY)).toBeNull();
  });

  it("summarises the Khatmah's progress and today's portion for the date asked", () => {
    const logs: KhatmahLog[] = [{ khatmahId: "k", session: 1, date: START }];
    const reading = sources([khatmah("k")], logs).khatmah(TODAY);
    expect(reading).toMatchObject({
      id: "k",
      done: 1,
      total: 30,
      state: "on-track",
      completedToday: false,
      current: { number: 2 },
    });
    // Two days on, with nothing more read, the Khatmah is behind.
    expect(
      sources([khatmah("k")], logs).khatmah(TODAY.add({ days: 2 }))
    ).toMatchObject({ state: "behind", sessions: 2 });
  });
});

describe("the widget links", () => {
  it("are the app's own links", () => {
    expect([
      WIDGET_LINKS.nextSalah,
      WIDGET_LINKS.calendar,
      WIDGET_LINKS.quran,
      WIDGET_LINKS.ayah("2:255"),
      WIDGET_LINKS.khatmah(),
      WIDGET_LINKS.khatmah("k-1"),
    ]).toStrictEqual([
      "alrisali://next-salah",
      "alrisali://calendar",
      "alrisali://quran",
      "alrisali://ayah/2:255",
      "alrisali://khatmah",
      "alrisali://khatmah/k-1",
    ]);
  });
});
