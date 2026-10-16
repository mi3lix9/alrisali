import { describe, expect, it } from "vitest";

import { SUNNAH_PRAYER_PRESETS } from "./presets";
import {
  actSchema,
  availablePrograms,
  isProgramAvailable,
  officialProgramSchema,
} from "./program";
import type { OfficialProgramInput } from "./program";

const name = { ar: "رمضان", en: "Ramadan" };
const empty = { ar: "", en: "" };

const general: OfficialProgramInput = {
  id: "daily-nawafil",
  category: "general",
  name: { ar: "النوافل اليومية", en: "Daily nawafil" },
  description: empty,
  active: true,
  acts: [],
};

const ramadan: OfficialProgramInput = {
  id: "ramadan",
  category: "seasonal",
  name,
  description: empty,
  active: true,
  window: { start: { month: 9, day: 1 }, end: { month: 9, day: 30 } },
  acts: [],
};

// Dhu al-Hijjah 25 → Muharram 10: crosses the turn of the Hijri year.
const muharram: OfficialProgramInput = {
  ...ramadan,
  id: "muharram",
  window: { start: { month: 12, day: 25 }, end: { month: 1, day: 10 } },
};

const program = (input: OfficialProgramInput) =>
  officialProgramSchema.parse(input);

describe("Seasonal window visibility", () => {
  it("shows a General Program on every day of the year", () => {
    for (const month of [1, 6, 9, 12] as const) {
      expect(
        isProgramAvailable(program(general), { year: 1447, month, day: 15 })
      ).toBeTruthy();
    }
  });

  it("shows a Seasonal Program from the first to the last day of its window", () => {
    const season = program(ramadan);

    expect(
      isProgramAvailable(season, { year: 1447, month: 8, day: 30 })
    ).toBeFalsy();
    expect(
      isProgramAvailable(season, { year: 1447, month: 9, day: 1 })
    ).toBeTruthy();
    expect(
      isProgramAvailable(season, { year: 1447, month: 9, day: 29 })
    ).toBeTruthy();
    expect(
      isProgramAvailable(season, { year: 1447, month: 10, day: 1 })
    ).toBeFalsy();
  });

  it("comes round again every Hijri year", () => {
    for (const year of [1447, 1448, 1460]) {
      expect(
        isProgramAvailable(program(ramadan), { year, month: 9, day: 15 })
      ).toBeTruthy();
    }
  });

  it("shows a window that crosses the new Hijri year on both sides of it", () => {
    const season = program(muharram);

    expect(
      isProgramAvailable(season, { year: 1446, month: 12, day: 24 })
    ).toBeFalsy();
    expect(
      isProgramAvailable(season, { year: 1446, month: 12, day: 25 })
    ).toBeTruthy();
    expect(
      isProgramAvailable(season, { year: 1447, month: 1, day: 10 })
    ).toBeTruthy();
    expect(
      isProgramAvailable(season, { year: 1447, month: 1, day: 11 })
    ).toBeFalsy();
    expect(
      isProgramAvailable(season, { year: 1447, month: 6, day: 1 })
    ).toBeFalsy();
  });

  it("hides an inactive Program, in season or not", () => {
    const today = { year: 1447, month: 9, day: 10 } as const;

    expect(
      isProgramAvailable(program({ ...general, active: false }), today)
    ).toBeFalsy();
    expect(
      isProgramAvailable(program({ ...ramadan, active: false }), today)
    ).toBeFalsy();
  });

  it("lists the Programs available today in the Admins' order", () => {
    const programs = [ramadan, general, muharram].map(program);

    expect(
      availablePrograms(programs, { year: 1447, month: 9, day: 10 }).map(
        ({ id }) => id
      )
    ).toStrictEqual(["ramadan", "daily-nawafil"]);
  });
});

const act = {
  id: "act-1",
  name: { ar: "دعاء الصباح", en: "Morning dua" },
  description: empty,
  schedule: { kind: "daily" },
  salah: null,
  detail: { type: "regular" },
} as const;

describe("Official Program validation", () => {
  it("needs a Hijri window on a Seasonal Program", () => {
    const { window: _window, ...withoutWindow } =
      ramadan as OfficialProgramInput & {
        window: unknown;
      };

    expect(officialProgramSchema.safeParse(withoutWindow).success).toBeFalsy();
  });

  it("refuses a window day beyond the 30th or a month beyond the 12th", () => {
    for (const window of [
      { start: { month: 9, day: 31 }, end: { month: 9, day: 30 } },
      { start: { month: 13, day: 1 }, end: { month: 9, day: 30 } },
    ]) {
      expect(
        officialProgramSchema.safeParse({ ...ramadan, window }).success
      ).toBeFalsy();
    }
  });

  it("needs a name in both languages", () => {
    expect(
      officialProgramSchema.safeParse({
        ...general,
        name: { ar: " ", en: "x" },
      }).success
    ).toBeFalsy();
  });

  it("refuses two Acts with one id", () => {
    expect(
      officialProgramSchema.safeParse({ ...general, acts: [act, act] }).success
    ).toBeFalsy();
  });

  it("sorts and dedupes an Act's weekdays", () => {
    expect(
      actSchema.parse({
        ...act,
        schedule: { kind: "weekdays", weekdays: [5, 1, 5] },
      }).schedule
    ).toStrictEqual({ kind: "weekdays", weekdays: [1, 5] });
  });

  it("refuses an Act on no weekdays or on a day that is not a date", () => {
    for (const schedule of [
      { kind: "weekdays", weekdays: [] },
      { kind: "weekdays", weekdays: [8] },
      { kind: "once", date: "2026-02-30" },
    ]) {
      expect(actSchema.safeParse({ ...act, schedule }).success).toBeFalsy();
    }
  });

  it("needs a dua Act's Arabic text and an http(s) audio link", () => {
    const dua = {
      type: "dua",
      arabic: "اللهم",
      transliteration: "",
      translation: "O Allah",
      instructions: empty,
      audioUrl: "https://cdn.alrisali.app/dua.mp3",
    };

    expect(actSchema.safeParse({ ...act, detail: dua }).success).toBeTruthy();
    expect(
      actSchema.safeParse({ ...act, detail: { ...dua, arabic: "" } }).success
    ).toBeFalsy();
    expect(
      actSchema.safeParse({
        ...act,
        detail: { ...dua, audioUrl: "ftp://cdn.alrisali.app/dua.mp3" },
      }).success
    ).toBeFalsy();
  });

  it("makes a valid prayer Act from every sunnah prayer preset", () => {
    for (const preset of SUNNAH_PRAYER_PRESETS) {
      expect(
        actSchema.safeParse({
          ...act,
          name: preset.name,
          salah: preset.salah,
          detail: {
            type: "prayer",
            preset: preset.key,
            rakahs: preset.rakahs,
            steps: empty,
            adhkar: empty,
            requiresWudu: true,
          },
        }).success
      ).toBeTruthy();
    }
  });
});
