import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import type {
  DhikrSessionSource,
  InsightsHabit,
  InsightsSources,
  KhushuRating,
} from "../shared";
import { HEATMAP_DAYS, insights, loggedKhushu } from "./insights";

const date = (iso: string) => Temporal.PlainDate.from(iso);

// 2026-10-15 is a Thursday.
const TODAY = date("2026-10-15");

const ALL_FIVE = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

const NOTHING: InsightsSources = {
  prayerLogs: [],
  khushu: [],
  habits: [],
  habitCompletions: [],
  dhikrSessions: [],
  moodCheckIns: [],
};

const habit = (
  id: string,
  overrides: Partial<InsightsHabit> = {}
): InsightsHabit => ({
  id,
  name: id,
  preset: null,
  schedule: { kind: "daily" },
  archived: false,
  createdOn: date("2026-01-01"),
  ...overrides,
});

const ZAHRA = { kind: "tasbih-al-zahra" } as const;

const session = (
  iso: string,
  tasbihId: string,
  count: number,
  tasbih: DhikrSessionSource["tasbih"]
): DhikrSessionSource => ({ tasbihId, tasbih, count, date: date(iso) });
const rating = (
  iso: string,
  salah: KhushuRating["salah"],
  level: number,
  distractions: string[] = [],
  customDistraction: string | null = null
): KhushuRating => ({
  date: date(iso),
  salah,
  level,
  distractions,
  customDistraction,
});

describe(loggedKhushu, () => {
  it("keeps only ratings whose Salah is ticked in the Prayer Log for that date", () => {
    const prayerLogs = [
      { date: date("2026-10-14"), performed: ["fajr", "dhuhr"] as const },
      { date: date("2026-10-15"), performed: ["asr"] as const },
    ];
    const khushu = [
      rating("2026-10-14", "fajr", 8),
      // Rated, then un-ticked.
      rating("2026-10-14", "asr", 2),
      rating("2026-10-15", "asr", 6),
      // Never logged on that date.
      rating("2026-10-13", "fajr", 9),
    ];

    expect(loggedKhushu(khushu, prayerLogs)).toStrictEqual([
      rating("2026-10-14", "fajr", 8),
      rating("2026-10-15", "asr", 6),
    ]);
  });
});

describe(insights, () => {
  it("is empty for a Guest who has recorded nothing yet", () => {
    const found = insights(NOTHING, TODAY);

    expect(found.overview).toStrictEqual({
      prayerStreak: 0,
      todayComplete: false,
      salahLogged: 0,
      salahPossible: 35,
      averageKhushu: null,
      khushuChange: null,
      habitCompletion: null,
    });
    expect(found.week.map((day) => day.date.toString())).toStrictEqual([
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
    ]);
    expect(found.heatmap).toHaveLength(84);
    expect({
      heatmapLevels: [...new Set(found.heatmap.map((day) => day.level))],
      habitStreaks: found.habitStreaks,
      tasbihTotals: found.tasbihTotals,
      moods: found.moods,
      distractions: found.distractions,
    }).toStrictEqual({
      heatmapLevels: [0],
      habitStreaks: [],
      tasbihTotals: [],
      moods: { checkIns: 0, moods: [] },
      distractions: { ratedSalah: 0, distractions: [] },
    });
  });

  describe("overview", () => {
    const completeDays = ["2026-10-12", "2026-10-13", "2026-10-14"].map(
      (iso) => ({ date: date(iso), performed: ALL_FIVE })
    );

    it("shows the Prayer Streak that ended yesterday while today is incomplete", () => {
      const sources = {
        ...NOTHING,
        prayerLogs: [
          ...completeDays,
          { date: TODAY, performed: ["fajr", "dhuhr"] as const },
        ],
      };

      expect(insights(sources, TODAY).overview).toMatchObject({
        prayerStreak: 3,
        todayComplete: false,
      });
    });

    it("counts today in the Prayer Streak once all five are logged", () => {
      const sources = {
        ...NOTHING,
        prayerLogs: [...completeDays, { date: TODAY, performed: ALL_FIVE }],
      };

      expect(insights(sources, TODAY).overview).toMatchObject({
        prayerStreak: 4,
        todayComplete: true,
      });
    });

    it("counts Salah logged in the last 7 days only", () => {
      const sources = {
        ...NOTHING,
        prayerLogs: [
          // Eight days ago: outside the week.
          { date: date("2026-10-07"), performed: ALL_FIVE },
          { date: date("2026-10-09"), performed: ["fajr"] as const },
          { date: TODAY, performed: ALL_FIVE },
        ],
      };

      expect(insights(sources, TODAY).overview).toMatchObject({
        salahLogged: 6,
        salahPossible: 35,
      });
    });

    it("averages Khushu over logged Salah only, against the week before", () => {
      const sources: InsightsSources = {
        ...NOTHING,
        prayerLogs: [
          { date: date("2026-10-05"), performed: ["fajr"] },
          { date: date("2026-10-14"), performed: ["fajr", "dhuhr"] },
        ],
        khushu: [
          rating("2026-10-05", "fajr", 5),
          rating("2026-10-14", "fajr", 8),
          rating("2026-10-14", "dhuhr", 6),
          // Un-ticked after rating: not counted.
          rating("2026-10-14", "asr", 0),
        ],
      };

      expect(insights(sources, TODAY).overview).toMatchObject({
        averageKhushu: 7,
        khushuChange: 2,
      });
    });

    it("rates Habits against the days each was due, ignoring archived ones", () => {
      const sources: InsightsSources = {
        ...NOTHING,
        habits: [
          // Due all 7 days.
          habit("daily"),
          // Due Monday 2026-10-12 and Thursday 2026-10-15.
          habit("mon-thu", {
            schedule: { kind: "weekdays", weekdays: [1, 4] },
          }),
          // Created yesterday: due 2 days.
          habit("new", { createdOn: date("2026-10-14") }),
          habit("archived", { archived: true }),
        ],
        habitCompletions: [
          { habitId: "daily", date: date("2026-10-10") },
          { habitId: "daily", date: TODAY },
          { habitId: "mon-thu", date: date("2026-10-12") },
          // Not due on a Tuesday: not counted.
          { habitId: "mon-thu", date: date("2026-10-13") },
          { habitId: "new", date: TODAY },
          { habitId: "archived", date: TODAY },
          // A Habit since deleted.
          { habitId: "gone", date: TODAY },
        ],
      };

      // 4 ticked of 7 + 2 + 2 due.
      expect(insights(sources, TODAY).overview.habitCompletion).toBeCloseTo(
        4 / 11
      );
    });
  });

  it("charts each day of the week", () => {
    const sources: InsightsSources = {
      ...NOTHING,
      prayerLogs: [
        { date: date("2026-10-14"), performed: ["fajr", "dhuhr", "asr"] },
      ],
      khushu: [
        rating("2026-10-14", "fajr", 9),
        rating("2026-10-14", "dhuhr", 6),
      ],
      habits: [habit("daily")],
      habitCompletions: [{ habitId: "daily", date: date("2026-10-14") }],
      dhikrSessions: [
        session("2026-10-14", "tasbih-al-zahra", 100, ZAHRA),
        session("2026-10-14", "tasbih-al-zahra", 100, ZAHRA),
      ],
    };

    const { week } = insights(sources, TODAY);

    expect(week[5]).toStrictEqual({
      date: date("2026-10-14"),
      salah: 3,
      habitsDone: 1,
      habitsDue: 1,
      dhikrSessions: 2,
      averageKhushu: 7.5,
    });
    expect(week[6]).toStrictEqual({
      date: TODAY,
      salah: 0,
      habitsDone: 0,
      habitsDue: 1,
      dhikrSessions: 0,
      averageKhushu: null,
    });
  });

  it("fills the 84-day heatmap from Salah, due Habits and Dhikr", () => {
    const sources: InsightsSources = {
      ...NOTHING,
      prayerLogs: [
        { date: date("2026-07-24"), performed: ALL_FIVE },
        { date: date("2026-10-13"), performed: ["fajr"] },
        { date: date("2026-10-14"), performed: ALL_FIVE },
        { date: TODAY, performed: ALL_FIVE },
      ],
      habits: [habit("daily", { createdOn: date("2026-10-15") })],
      habitCompletions: [{ habitId: "daily", date: TODAY }],
      dhikrSessions: [
        session("2026-10-12", "tasbih-al-zahra", 100, ZAHRA),
        session("2026-10-15", "tasbih-al-zahra", 100, ZAHRA),
      ],
    };

    const { heatmap } = insights(sources, TODAY);
    expect(heatmap).toHaveLength(HEATMAP_DAYS);
    expect(heatmap[0]?.date).toStrictEqual(date("2026-07-24"));
    expect(heatmap.at(-1)?.date).toStrictEqual(TODAY);
    expect(
      heatmap
        .filter((day) => day.level > 0)
        .map((day) => [day.date.toString(), day.level])
    ).toStrictEqual([
      // All five alone.
      ["2026-07-24", 3],
      // A Dhikr Session alone.
      ["2026-10-12", 1],
      // One Salah.
      ["2026-10-13", 1],
      ["2026-10-14", 3],
      // Everything: all five, every due Habit and a Dhikr Session.
      ["2026-10-15", 4],
    ]);
  });

  it("lists active Habits' streaks, longest current first", () => {
    const sources: InsightsSources = {
      ...NOTHING,
      habits: [
        habit("water", { name: null, preset: "drink-water" }),
        habit("quran"),
        habit("old", { archived: true }),
      ],
      habitCompletions: [
        { habitId: "water", date: date("2026-10-01") },
        { habitId: "water", date: date("2026-10-02") },
        { habitId: "water", date: date("2026-10-03") },
        { habitId: "quran", date: date("2026-10-13") },
        { habitId: "quran", date: date("2026-10-14") },
        { habitId: "old", date: TODAY },
      ],
    };

    expect(insights(sources, TODAY).habitStreaks).toStrictEqual([
      { habitId: "quran", name: "quran", preset: null, current: 2, longest: 2 },
      {
        habitId: "water",
        name: null,
        preset: "drink-water",
        current: 0,
        longest: 3,
      },
    ]);
  });

  it("totals each Tasbih's Dhikr Sessions, a deleted Open Tasbih included", () => {
    const morning = { kind: "open", name: "Morning" } as const;
    const sources: InsightsSources = {
      ...NOTHING,
      dhikrSessions: [
        session("2026-01-02", "tasbih-al-zahra", 100, ZAHRA),
        session("2026-10-14", "morning", 33, morning),
        session("2026-10-15", "tasbih-al-zahra", 100, ZAHRA),
        session("2026-10-15", "removed-one", 500, { kind: "removed" }),
        session("2026-10-15", "morning", 99, morning),
      ],
    };

    expect(insights(sources, TODAY).tasbihTotals).toStrictEqual([
      {
        tasbihId: "removed-one",
        tasbih: { kind: "removed" },
        total: 500,
        sessions: 1,
      },
      {
        tasbihId: "tasbih-al-zahra",
        tasbih: { kind: "tasbih-al-zahra" },
        total: 200,
        sessions: 2,
      },
      { tasbihId: "morning", tasbih: morning, total: 132, sessions: 2 },
    ]);
  });

  it("distributes the last 30 days' Mood Check-ins", () => {
    const sources: InsightsSources = {
      ...NOTHING,
      moodCheckIns: [
        // 30 days before today: outside the period.
        { mood: "sad", date: date("2026-09-15") },
        { mood: "calm", date: date("2026-09-16") },
        { mood: "happy", date: date("2026-10-01") },
        { mood: "calm", date: date("2026-10-10") },
        { mood: "calm", date: TODAY },
      ],
    };

    expect(insights(sources, TODAY).moods).toStrictEqual({
      checkIns: 4,
      moods: [
        { mood: "calm", count: 3, share: 0.75 },
        { mood: "happy", count: 1, share: 0.25 },
      ],
    });
  });

  it("breaks down the last 30 days' Distractions of logged Salah", () => {
    const sources: InsightsSources = {
      ...NOTHING,
      prayerLogs: [
        { date: date("2026-09-10"), performed: ["fajr"] },
        { date: date("2026-10-14"), performed: ["fajr", "dhuhr"] },
        { date: TODAY, performed: ALL_FIVE },
      ],
      khushu: [
        // Outside the period.
        rating("2026-09-10", "fajr", 4, ["fatigue"]),
        rating("2026-10-14", "fajr", 5, ["fatigue", "phoneNotifications"]),
        rating("2026-10-14", "dhuhr", 6, ["fatigue"], "The neighbour's drill"),
        // Un-ticked Salah: not counted.
        rating("2026-10-14", "asr", 1, ["laziness", "fatigue"]),
        rating("2026-10-15", "fajr", 9),
        rating("2026-10-15", "isha", 7, [], "Hunger"),
      ],
    };

    expect(insights(sources, TODAY).distractions).toStrictEqual({
      ratedSalah: 4,
      distractions: [
        { distraction: "fatigue", count: 2, share: 0.5 },
        { distraction: null, count: 2, share: 0.5 },
        { distraction: "phoneNotifications", count: 1, share: 0.25 },
      ],
    });
  });
});
