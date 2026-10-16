import { getSupplication } from "@alrisali/content/books";
import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { createHijriCalendar } from "../shared";
import type { PrayerTimesSettings } from "../shared";
import {
  DEFAULT_NIGHT_DUA_ALERTS,
  NIGHT_DUA_RULES,
  nightDuaReminderSource,
} from "./night-dua-reminders";
import type {
  NightDuaAlerts,
  NightDuaReminderMessage,
} from "./night-dua-reminders";
import { planReminders } from "./planner";
import type { PlanRemindersInput } from "./planner";
import {
  applyReminderSettingsChange,
  DEFAULT_REMINDER_SETTINGS,
  SALAH,
} from "./settings";

// Najaf on Thursday 15 October 2026 (Ja'fari): Maghrib 17:46, Fajr 04:45; on
// Friday the 16th, Maghrib 17:44.
const NAJAF: PrayerTimesSettings = {
  coordinates: { latitude: 32.0259, longitude: 44.3462 },
  calculationMethod: "jafari",
  imsakMinutes: 10,
};

const NOON_THURSDAY = Temporal.ZonedDateTime.from(
  "2026-10-15T12:00[Asia/Baghdad]"
);

const NO_SALAH_ALERTS = applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
  salah: Object.fromEntries(SALAH.map((salah) => [salah, { atTime: "off" }])),
  imsak: { atTime: "off" },
});

const WORSHIP = [
  { kind: "ziyarah", day: "monday", supplicationId: "mafatih-ziyarat-ashura" },
  { kind: "night-dua", day: "thursday", supplicationId: "mafatih-dua-kumayl" },
];

const on = (...alerts: (keyof NightDuaAlerts)[]): NightDuaAlerts => ({
  ...DEFAULT_NIGHT_DUA_ALERTS,
  ...Object.fromEntries(alerts.map((alert) => [alert, true])),
});

const planned = (
  alerts: NightDuaAlerts,
  overrides: Partial<PlanRemindersInput<NightDuaReminderMessage>> = {},
  worship = WORSHIP
) =>
  planReminders<NightDuaReminderMessage>({
    now: NOON_THURSDAY,
    prayerTimes: NAJAF,
    settings: NO_SALAH_ALERTS,
    messageStyle: "modern",
    sources: [
      nightDuaReminderSource({
        alerts,
        prayerTimes: overrides.prayerTimes === undefined ? NAJAF : null,
        worship,
      }),
    ],
    days: 14,
    ...overrides,
  }).filter(({ message }) => message.kind === "night-dua");

const local = (reminder: { fireAt: Temporal.Instant } | undefined) =>
  reminder?.fireAt
    .toZonedDateTimeISO("Asia/Baghdad")
    .toPlainDateTime()
    .toString({ smallestUnit: "minute" }) ?? "";

describe(nightDuaReminderSource, () => {
  it("reminds of nothing until the Believer opts in", () => {
    expect(planned(DEFAULT_NIGHT_DUA_ALERTS)).toHaveLength(0);
  });

  it("reminds of Kumayl after Maghrib on Thursday night, with the next Hijri day", () => {
    const [kumayl, next] = planned(on("kumayl"));

    expect(local(kumayl)).toBe("2026-10-15T18:16");
    expect(kumayl?.message).toMatchObject({
      alert: "kumayl",
      supplicationIds: ["mafatih-dua-kumayl"],
      // The night of Friday: the Hijri day that began at Maghrib.
      hijri: createHijriCalendar().toHijri(
        Temporal.PlainDate.from("2026-10-16")
      ),
    });
    expect(local(next).slice(0, 10)).toBe("2026-10-22");
  });

  it("reminds of Tawassul on Tuesday night without a bundled text", () => {
    const [tawassul] = planned(on("tawassul"));

    expect(local(tawassul).slice(0, 10)).toBe("2026-10-20");
    expect(tawassul?.message).toMatchObject({
      alert: "tawassul",
      supplicationIds: [],
    });
  });

  it("reminds of Nudba on Friday morning, before Maghrib turns the Hijri day", () => {
    const [nudba] = planned(on("nudba"));

    expect(local(nudba).slice(0, 10)).toBe("2026-10-16");
    expect(Number(local(nudba).slice(11, 13))).toBeLessThan(8);
    expect(nudba?.message).toMatchObject({
      alert: "nudba",
      supplicationIds: ["mafatih-dua-nudba"],
      hijri: createHijriCalendar().toHijri(
        Temporal.PlainDate.from("2026-10-16")
      ),
    });
  });

  it("reminds of the day's ziyarah from the worship mapping", () => {
    const [ziyarah] = planned(on("ziyarah"));

    expect(local(ziyarah).slice(0, 10)).toBe("2026-10-19");
    expect(ziyarah?.message).toMatchObject({
      alert: "ziyarah",
      supplicationIds: ["mafatih-ziyarat-ashura"],
    });
  });

  it("has no ziyarah Reminder while the mapping lists none", () => {
    expect(planned(on("ziyarah"), {}, [])).toHaveLength(0);
  });

  it("keeps each toggle separate", () => {
    const alerts = planned(on("kumayl", "nudba")).map(
      ({ message }) => message.kind === "night-dua" && message.alert
    );

    expect(new Set(alerts)).toStrictEqual(new Set(["kumayl", "nudba"]));
  });

  it("holds Reminders back in quiet hours", () => {
    const quiet = applyReminderSettingsChange(NO_SALAH_ALERTS, {
      quietHours: { enabled: true, start: 18 * 60 + 10, end: 18 * 60 + 20 },
    });

    const kumayl = planned(on("kumayl"), { settings: quiet });

    expect(kumayl.map(local)).not.toContain("2026-10-15T18:16");
    expect(kumayl).toHaveLength(1);
  });

  it("plans nothing without a location", () => {
    expect(
      planned(on("kumayl", "tawassul", "nudba", "ziyarah"), {
        prayerTimes: null,
      })
    ).toHaveLength(0);
  });
});

describe("night-dua rules", () => {
  it("open Supplications the bundled Books hold", () => {
    const ids = Object.values(NIGHT_DUA_RULES)
      .map(({ supplicationId }) => supplicationId)
      .filter((id) => id !== null);

    expect(ids.map((id) => getSupplication(id)?.id)).toStrictEqual(ids);
  });
});
