import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { createHijriCalendar, OCCASION_TYPES } from "../shared";
import type { Occasion, PrayerTimesSettings } from "../shared";
import {
  applyOccasionAlertSettingsChange,
  DEFAULT_OCCASION_ALERT_SETTINGS,
  maghribFrom,
  occasionReminderSource,
  readOccasionAlertSettings,
} from "./occasion-alerts";
import type { OccasionAlertSettings } from "./occasion-alerts";
import { planReminders } from "./planner";
import { DEFAULT_REMINDER_SETTINGS } from "./settings";

// Najaf: Maghrib 17:46 on 15 October 2026, 17:44 on the 16th.
const NAJAF: PrayerTimesSettings = {
  coordinates: { latitude: 32.0259, longitude: 44.3462 },
  calculationMethod: "jafari",
  imsakMinutes: 10,
};
const ZONE = "Asia/Baghdad";
const calendar = createHijriCalendar();
const maghribOf = maghribFrom(NAJAF);

// The occasion falls on the Hijri Date of 16 October 2026.
const TARGET = Temporal.PlainDate.from("2026-10-16");
const hijri = calendar.toHijri(TARGET);
const occasion = (id: string, type: Occasion["type"]): Occasion => ({
  id,
  month: hijri.month,
  day: hijri.day,
  type,
  name: { ar: id, en: id },
});

const enabled = (
  change: Partial<OccasionAlertSettings> = {}
): OccasionAlertSettings => ({
  ...DEFAULT_OCCASION_ALERT_SETTINGS,
  enabled: true,
  ...change,
});

const NOW = Temporal.ZonedDateTime.from(`2026-10-14T12:00[${ZONE}]`);
const window = {
  now: NOW,
  end: NOW.toPlainDate().add({ days: 7 }).toZonedDateTime(ZONE),
  dates: Array.from({ length: 7 }, (_, offset) =>
    NOW.toPlainDate().add({ days: offset })
  ),
};

const run = (settings: OccasionAlertSettings, occasions: Occasion[]) =>
  occasionReminderSource({ settings, occasions, calendar, maghribOf })(window);

const local = (instant: Temporal.Instant | undefined) =>
  instant
    ?.toZonedDateTimeISO(ZONE)
    .toString({ timeZoneName: "never" })
    .slice(0, 16);

describe(occasionReminderSource, () => {
  it("sends nothing until enabled", () => {
    expect(
      run({ ...enabled(), enabled: false }, [occasion("a", "religious")])
    ).toStrictEqual([]);
  });

  it("alerts on the day at the chosen time", () => {
    const [only, ...rest] = run(enabled({ time: 9 * 60 + 30 }), [
      occasion("a", "religious"),
    ]);
    expect(rest).toStrictEqual([]);
    expect(only?.id).toBe("occasion:a:2026-10-16:day-of");
    expect(local(only?.fireAt)).toBe("2026-10-16T09:30");
    expect(only?.essential).toBeFalsy();
    expect(only?.message).toMatchObject({ kind: "occasion", occasionId: "a" });
  });

  it("alerts the evening before after Maghrib of the previous civil day", () => {
    const [only, ...rest] = run(
      enabled({ timing: "evening-before", time: 8 * 60 }),
      [occasion("a", "mourning")]
    );
    expect(rest).toStrictEqual([]);
    // The 15th's Maghrib is 17:46; 08:00 is before it, so Maghrib wins.
    expect(local(only?.fireAt)).toBe("2026-10-15T17:46");
    expect(only?.id).toBe("occasion:a:2026-10-15:evening-before");
  });

  it("keeps a chosen evening time that is after Maghrib", () => {
    const [only] = run(enabled({ timing: "evening-before", time: 20 * 60 }), [
      occasion("a", "mourning"),
    ]);
    expect(local(only?.fireAt)).toBe("2026-10-15T20:00");
  });

  it("sends no evening-before alert without a location", () => {
    const candidates = occasionReminderSource({
      settings: enabled({ timing: "evening-before" }),
      occasions: [occasion("a", "mourning")],
      calendar,
      maghribOf: maghribFrom(null),
    })(window);
    expect(candidates).toStrictEqual([]);
  });

  it("filters by type", () => {
    const occasions = [
      occasion("a", "religious"),
      occasion("b", "mourning"),
      occasion("c", "fasting"),
    ];
    expect(
      run(enabled({ types: ["mourning", "fasting"] }), occasions).map(
        ({ id }) => id
      )
    ).toStrictEqual([
      "occasion:b:2026-10-16:day-of",
      "occasion:c:2026-10-16:day-of",
    ]);
    expect(run(enabled({ types: [] }), occasions)).toStrictEqual([]);
  });
});

const planWith = (settings: OccasionAlertSettings, extra: Occasion[]) =>
  planReminders({
    now: NOW,
    prayerTimes: null,
    settings: DEFAULT_REMINDER_SETTINGS,
    messageStyle: "modern",
    sources: [
      occasionReminderSource({
        settings,
        occasions: extra,
        calendar,
        maghribOf,
      }),
    ],
  });

describe("occasions in the planner", () => {
  const many = Array.from({ length: 70 }, (_, index) => ({
    ...occasion(`o${index}`, "religious"),
  }));

  it("shares the 64 pending limit with every other reminder", () => {
    expect(planWith(enabled(), many)).toHaveLength(64);
  });

  it("is held back in quiet hours", () => {
    const quiet = {
      ...DEFAULT_REMINDER_SETTINGS,
      quietHours: { enabled: true, start: 7 * 60, end: 10 * 60 },
    };
    const reminders = planReminders({
      now: NOW,
      prayerTimes: null,
      settings: quiet,
      messageStyle: "modern",
      sources: [
        occasionReminderSource({
          settings: enabled(),
          occasions: [occasion("a", "religious")],
          calendar,
          maghribOf,
        }),
      ],
    });
    expect(reminders).toStrictEqual([]);
  });
});

describe("occasion alert settings", () => {
  it("start off with every type", () => {
    expect(DEFAULT_OCCASION_ALERT_SETTINGS).toMatchObject({
      enabled: false,
      types: OCCASION_TYPES,
    });
  });

  it("apply a change and keep the rest", () => {
    expect(
      applyOccasionAlertSettingsChange(DEFAULT_OCCASION_ALERT_SETTINGS, {
        timing: "evening-before",
        types: ["mourning"],
      })
    ).toStrictEqual({
      ...DEFAULT_OCCASION_ALERT_SETTINGS,
      timing: "evening-before",
      types: ["mourning"],
    });
  });

  it("reject an invalid change", () => {
    expect(() =>
      applyOccasionAlertSettingsChange(DEFAULT_OCCASION_ALERT_SETTINGS, {
        time: 2000,
      })
    ).toThrow("1439");
  });

  it("read stored values field by field", () => {
    expect(
      readOccasionAlertSettings({
        enabled: true,
        timing: "someday",
        time: 600,
        types: ["fasting", "future", "mourning"],
      })
    ).toStrictEqual({
      enabled: true,
      timing: "day-of",
      time: 600,
      types: ["mourning", "fasting"],
    });
  });
});
