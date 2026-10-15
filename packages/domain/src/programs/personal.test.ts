import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { actsForDate } from "./acts";
import {
  asProgramWithActs,
  copyAct,
  editAct,
  personalProgramSchema,
  writtenAct,
} from "./personal";
import { actSchema } from "./program";

const thursday = Temporal.PlainDate.from("2026-10-15");
const shawwalDay = { year: 1448, month: 10, day: 2 } as const;

const tasbih = writtenAct({
  id: "tasbih",
  name: "  تسبيح الزهراء  ",
  schedule: { kind: "daily" },
  salah: { salah: "fajr", timing: "after" },
});

const officialDua = actSchema.parse({
  id: "kumayl",
  name: { ar: "دعاء كميل", en: "Dua Kumayl" },
  description: { ar: "", en: "" },
  schedule: { kind: "weekdays", weekdays: [4] },
  salah: null,
  detail: {
    type: "dua",
    arabic: "اللهم إني أسألك برحمتك",
    transliteration: "",
    translation: "",
    instructions: { ar: "", en: "" },
    audioUrl: null,
  },
});

describe("Personal Programs", () => {
  it("names a written Act the same in both languages, as a plain Act", () => {
    expect(tasbih).toStrictEqual({
      id: "tasbih",
      name: { ar: "تسبيح الزهراء", en: "تسبيح الزهراء" },
      description: { ar: "", en: "" },
      schedule: { kind: "daily" },
      salah: { salah: "fajr", timing: "after" },
      detail: { type: "regular" },
    });
  });

  it("refuses a written Act without a name or weekdays", () => {
    expect(() =>
      writtenAct({
        id: "a",
        name: "  ",
        schedule: { kind: "daily" },
        salah: null,
      })
    ).toThrow(ZodError);
    expect(() =>
      writtenAct({
        id: "a",
        name: "Act",
        schedule: { kind: "weekdays", weekdays: [] },
        salah: null,
      })
    ).toThrow(ZodError);
  });

  it("copies an Official Act under a new id, its dua included", () => {
    expect(copyAct(officialDua, "copy-1")).toStrictEqual({
      ...officialDua,
      id: "copy-1",
    });
  });

  it("edits an Act's timing and keeps its dua; a new name replaces both", () => {
    const moved = editAct(officialDua, {
      schedule: { kind: "daily" },
      salah: { salah: "isha", timing: "after" },
    });
    expect(moved).toStrictEqual({
      ...officialDua,
      schedule: { kind: "daily" },
      salah: { salah: "isha", timing: "after" },
    });
    expect(
      editAct(officialDua, {
        name: "كميل",
        schedule: officialDua.schedule,
        salah: null,
      }).name
    ).toStrictEqual({ ar: "كميل", en: "كميل" });
  });

  it("needs a name, and each Act once", () => {
    const valid = {
      id: "mine",
      name: " My nights ",
      description: "",
      acts: [tasbih],
    };
    expect(personalProgramSchema.parse(valid).name).toBe("My nights");
    expect(
      personalProgramSchema.safeParse({ ...valid, name: " " }).success
    ).toBeFalsy();
    expect(
      personalProgramSchema.safeParse({ ...valid, acts: [tasbih, tasbih] })
        .success
    ).toBeFalsy();
  });

  it("lists a subscribed Personal Program's Acts with the Official ones, any season", () => {
    const mine = asProgramWithActs(
      personalProgramSchema.parse({
        id: "mine",
        name: "Mine",
        description: "",
        acts: [tasbih, copyAct(officialDua, "kumayl-copy")],
      })
    );

    const day = actsForDate({
      programs: [mine],
      subscriptions: [
        {
          programId: "mine",
          programKind: "personal",
          paused: false,
          subscribedAt: 1,
        },
      ],
      date: thursday,
      hijriDate: shawwalDay,
    });

    expect(day.bySalah).toMatchObject([
      { salah: "fajr", before: [], after: [{ act: { id: "tasbih" } }] },
    ]);
    expect(day.general).toMatchObject([
      { program: { id: "mine", name: "Mine" }, act: { id: "kumayl-copy" } },
    ]);
  });
});
