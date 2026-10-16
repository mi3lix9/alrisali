import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import type { InsightsSources } from "../shared";
import { khatmahInsights } from "./khatmah";

const date = (text: string): Temporal.PlainDate =>
  Temporal.PlainDate.from(text);

const sources = (khatmahs: InsightsSources["khatmahs"]): InsightsSources => ({
  prayerLogs: [],
  khushu: [],
  habits: [],
  habitCompletions: [],
  dhikrSessions: [],
  moodCheckIns: [],
  khatmahs,
});

describe(khatmahInsights, () => {
  it("counts only finished Khatmahs, the latest first, with the days they took", () => {
    const found = khatmahInsights(
      sources([
        {
          id: "old",
          startDate: date("2026-01-01"),
          completedOn: date("2026-01-30"),
          sessions: [{ session: 1, date: date("2026-01-30"), pages: 20 }],
        },
        {
          id: "unfinished",
          startDate: date("2026-03-01"),
          completedOn: null,
          sessions: [],
        },
        {
          id: "new",
          startDate: date("2026-02-01"),
          completedOn: date("2026-02-10"),
          sessions: [],
        },
      ])
    );

    expect(found.completed.map(({ khatmahId }) => khatmahId)).toStrictEqual([
      "new",
      "old",
    ]);
    expect(found.completed.map(({ days }) => days)).toStrictEqual([10, 30]);
  });

  it("charts the pages of each session of the newest Khatmah", () => {
    const found = khatmahInsights(
      sources([
        {
          id: "a",
          startDate: date("2026-01-01"),
          completedOn: null,
          sessions: [
            { session: 1, date: date("2026-01-01"), pages: 20 },
            { session: 2, date: date("2026-01-02"), pages: 21 },
          ],
        },
      ])
    );

    expect(found.chart.map(({ pages }) => pages)).toStrictEqual([20, 21]);
    expect(khatmahInsights(sources([])).chart).toStrictEqual([]);
  });
});
