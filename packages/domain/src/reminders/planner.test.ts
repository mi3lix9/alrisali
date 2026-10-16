import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { createHijriCalendar } from "../shared";
import type { PrayerTimesSettings } from "../shared";
import { diffSchedule, isStaleAlert, planReminders } from "./planner";
import type {
  PlannedReminder,
  PlanRemindersInput,
  PrayerReminderMessage,
  ReminderCandidate,
  ReminderWindow,
} from "./planner";
import { classicSayingById } from "./sayings";
import {
  applyReminderSettingsChange,
  DEFAULT_REMINDER_SETTINGS,
  SALAH,
} from "./settings";
import type { ReminderRule } from "./settings";

// Najaf on 15–16 October 2026 (Ja'fari, Imsak 10 minutes before Fajr), from
// the Prayer Times calculation that its own tests check against Aladhan:
// 15th: Imsak 04:35, Fajr 04:45, Dhuhr 11:49, Asr 15:03, Maghrib 17:46, Isha 18:47
// 16th: Imsak 04:35, Fajr 04:45, Dhuhr 11:49, Asr 15:02, Maghrib 17:44, Isha 18:46
const NAJAF: PrayerTimesSettings = {
  coordinates: { latitude: 32.0259, longitude: 44.3462 },
  calculationMethod: "jafari",
  imsakMinutes: 10,
};

const at = (iso: string) => Temporal.ZonedDateTime.from(iso);

const NOON_IN_NAJAF = at("2026-10-15T12:00[Asia/Baghdad]");

/** The defaults without any At-Time Alert: the Reminders before alone. */
const BEFORE_ONLY = applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
  salah: Object.fromEntries(SALAH.map((salah) => [salah, { atTime: "off" }])),
  imsak: { atTime: "off" },
});

const everyReminderOn = applyReminderSettingsChange(BEFORE_ONLY, {
  salah: Object.fromEntries(SALAH.map((salah) => [salah, { enabled: true }])),
  imsak: { enabled: true },
});

const plan = <Extra = never>(
  overrides: Partial<PlanRemindersInput<Extra>> = {}
) =>
  planReminders<Extra>({
    now: NOON_IN_NAJAF,
    prayerTimes: NAJAF,
    settings: BEFORE_ONLY,
    messageStyle: "classic",
    ...overrides,
  });

/** Local wall-clock fire times, e.g. "2026-10-15T17:41". */
const localFireTimes = (
  reminders: readonly { fireAt: Temporal.Instant }[],
  timeZone = "Asia/Baghdad"
) =>
  reminders.map(({ fireAt }) =>
    fireAt.toZonedDateTimeISO(timeZone).toPlainDateTime().toString({
      smallestUnit: "minute",
    })
  );

/** A Habit-like Reminder fed in through the generic input. */
const habitAt = (
  id: string,
  instant: Temporal.Instant,
  essential = false
): ReminderCandidate<{ kind: "habit" }> => ({
  id,
  fireAt: instant,
  alert: { kind: "sound", sound: "chime" },
  essential,
  message: { kind: "habit" },
});

const fajrWith = (rule: Partial<ReminderRule>) =>
  plan({
    now: at("2026-10-16T00:00[Asia/Baghdad]"),
    days: 1,
    settings: applyReminderSettingsChange(BEFORE_ONLY, {
      salah: { fajr: { sound: "bell", ...rule } },
    }),
  }).find(({ id }) => id === "prayer:2026-10-16:fajr:before");

const QUIET_NIGHTS = applyReminderSettingsChange(BEFORE_ONLY, {
  quietHours: { enabled: true, start: 22 * 60, end: 5 * 60 },
});

const lateAndMorningHabits = (window: ReminderWindow) => [
  habitAt("habit:late", window.now.withPlainTime("23:30").toInstant()),
  habitAt(
    "habit:morning",
    window.now.add({ days: 1 }).withPlainTime("07:00").toInstant()
  ),
];

// 20:30 UTC is 21:30 in London (still on summer time) and 23:30 in Najaf.
const EVENING = Temporal.Instant.from("2026-10-15T20:30:00Z");

/** The ids planned for an evening Habit with quiet hours from 22:00 to 06:00. */
const eveningPlanIn = (timeZone: string) =>
  plan({
    now: NOON_IN_NAJAF.withTimeZone(timeZone),
    settings: applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
      quietHours: { enabled: true, start: 22 * 60, end: 6 * 60 },
    }),
    days: 1,
    sources: [() => [habitAt("habit:evening", EVENING)]],
  }).map(({ id }) => id);

/** Each Classic Reminder's Prayer Time with its saying's topic. */
const sayingTopics = (
  reminders: readonly { message: PrayerReminderMessage }[],
  prayerTimes: readonly string[]
) =>
  new Set(
    reminders
      .filter(({ message }) => prayerTimes.includes(message.prayerTime))
      .map(({ message }) =>
        message.sayingId ? classicSayingById(message.sayingId)?.topic : null
      )
  );

/** The At-Time Alerts of a plan, without the Reminders before. */
const atTime = (reminders: readonly PlannedReminder[]) =>
  reminders.filter(({ message }) => message.timing === "at-time");

describe(planReminders, () => {
  it("plans the coming days' Reminders, minutes before each Salah, in order", () => {
    const reminders = plan({ days: 2 });

    expect(reminders.map(({ id }) => id)).toStrictEqual([
      "prayer:2026-10-15:maghrib:before",
      "prayer:2026-10-16:fajr:before",
      "prayer:2026-10-16:dhuhr:before",
      "prayer:2026-10-16:maghrib:before",
    ]);
    expect(localFireTimes(reminders)).toStrictEqual([
      "2026-10-15T17:41",
      "2026-10-16T04:40",
      "2026-10-16T11:44",
      "2026-10-16T17:39",
    ]);
  });

  it("skips what has already fired and stops at the end of the window", () => {
    const reminders = plan({
      now: at("2026-10-15T17:41:30[Asia/Baghdad]"),
      days: 1,
    });

    expect(reminders).toStrictEqual([]);
  });

  it("uses each Salah's own minutes before, and Imsak at its time", () => {
    const settings = applyReminderSettingsChange(BEFORE_ONLY, {
      salah: { fajr: { minutesBefore: 0 }, dhuhr: { minutesBefore: 30 } },
      imsak: { enabled: true },
    });

    const reminders = plan({
      now: at("2026-10-16T00:00[Asia/Baghdad]"),
      settings,
      days: 1,
    });

    expect(reminders.map(({ id }) => id)).toStrictEqual([
      "prayer:2026-10-16:imsak:before",
      "prayer:2026-10-16:fajr:before",
      "prayer:2026-10-16:dhuhr:before",
      "prayer:2026-10-16:maghrib:before",
    ]);
    expect(localFireTimes(reminders)).toStrictEqual([
      "2026-10-16T04:35",
      "2026-10-16T04:45",
      "2026-10-16T11:19",
      "2026-10-16T17:39",
    ]);
  });

  it("keeps no more than 64 Reminders, the soonest ones", () => {
    const reminders = plan({ settings: everyReminderOn, days: 14 });

    // Asr, Maghrib and Isha are left today; then six a day (Imsak and the
    // five Salah) for ten days make 63, and the 64th is the next Imsak.
    expect(reminders).toHaveLength(64);
    expect(reminders.at(0)?.id).toBe("prayer:2026-10-15:asr:before");
    expect(reminders.at(-1)?.id).toBe("prayer:2026-10-26:imsak:before");
  });

  it("can keep fewer when asked", () => {
    expect(plan({ settings: everyReminderOn, limit: 2 })).toHaveLength(2);
  });

  describe("mute, voice and disable", () => {
    it("plays the chosen sound", () => {
      expect(fajrWith({})?.alert).toStrictEqual({
        kind: "sound",
        sound: "bell",
      });
    });

    it("plays the voice instead of the sound", () => {
      expect(fajrWith({ voice: true })?.alert).toStrictEqual({
        kind: "voice",
      });
    });

    it("keeps a muted Salah silent, even with the voice on", () => {
      expect(fajrWith({ muted: true, voice: true })?.alert).toStrictEqual({
        kind: "silent",
      });
    });

    it("drops a disabled Salah, whatever else is set", () => {
      expect(
        fajrWith({ enabled: false, muted: true, voice: true })
      ).toBeUndefined();
    });
  });

  describe("quiet hours", () => {
    it("holds back non-essential Reminders, across midnight", () => {
      const ids = plan({
        days: 2,
        settings: QUIET_NIGHTS,
        sources: [lateAndMorningHabits],
      }).map(({ id }) => id);

      expect(ids).not.toContain("habit:late");
      expect(ids).toContain("habit:morning");
    });

    it("holds back a Salah's Reminder before it", () => {
      const ids = plan({ days: 2, settings: QUIET_NIGHTS }).map(({ id }) => id);

      // Fajr's Reminder fires at 04:40, inside the quiet hours.
      expect(ids).not.toContain("prayer:2026-10-16:fajr:before");
      expect(ids).toContain("prayer:2026-10-16:dhuhr:before");
    });

    it("never holds back an At-Time Alert or Imsak", () => {
      const ids = plan({
        days: 2,
        settings: applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
          imsak: { enabled: true, ramadanOnly: false },
          quietHours: { enabled: true, start: 22 * 60, end: 5 * 60 },
        }),
      }).map(({ id }) => id);

      // Imsak (04:35) and Fajr (04:45) fall inside the quiet hours.
      expect(ids).toContain("prayer:2026-10-16:fajr:at-time");
      expect(ids).toContain("prayer:2026-10-16:imsak:before");
      expect(ids).toContain("prayer:2026-10-16:imsak:at-time");
    });

    it("lets an essential Reminder from a source through", () => {
      const ids = plan({
        days: 2,
        settings: QUIET_NIGHTS,
        sources: [
          (window) => [
            habitAt(
              "habit:essential",
              window.now.withPlainTime("23:30").toInstant(),
              true
            ),
          ],
        ],
      }).map(({ id }) => id);

      expect(ids).toContain("habit:essential");
    });

    it("does nothing while switched off", () => {
      const ids = plan({ days: 2, sources: [lateAndMorningHabits] }).map(
        ({ id }) => id
      );

      expect(ids).toContain("habit:late");
    });
  });

  describe("time zone changes", () => {
    it("applies quiet hours on the device's new local clock", () => {
      expect(eveningPlanIn("Asia/Baghdad")).not.toContain("habit:evening");
      expect(eveningPlanIn("Europe/London")).toContain("habit:evening");
    });

    it("keeps the place's Prayer Times and names days on the new clock", () => {
      const reminders = plan({
        now: NOON_IN_NAJAF.withTimeZone("Europe/London"),
        days: 2,
      });

      // Najaf's Maghrib (17:46 there) is 15:46 in London, so it is still
      // the 15th there; the window now ends at London's midnight.
      expect(reminders.map(({ id }) => id)).toStrictEqual([
        "prayer:2026-10-15:maghrib:before",
        "prayer:2026-10-16:fajr:before",
        "prayer:2026-10-16:dhuhr:before",
        "prayer:2026-10-16:maghrib:before",
      ]);
      expect(localFireTimes(reminders)).toStrictEqual([
        "2026-10-15T17:41",
        "2026-10-16T04:40",
        "2026-10-16T11:44",
        "2026-10-16T17:39",
      ]);
      expect(reminders[0]?.message).toMatchObject({
        at: at("2026-10-15T15:46[Europe/London]"),
      });
    });

    it("follows daylight saving: the local clock moves, the sun does not", () => {
      // London leaves summer time on 25 October 2026. Solar noon there is
      // about 11:45 UTC that week (timeanddate.com: 12:44 BST on the 24th),
      // and Dhuhr is a minute after it.
      const reminders = plan({
        now: at("2026-10-24T12:00[Europe/London]"),
        prayerTimes: {
          ...NAJAF,
          coordinates: { latitude: 51.5074, longitude: -0.1278 },
        },
        days: 3,
      }).filter(({ id }) => id.includes(":dhuhr:"));

      expect(localFireTimes(reminders, "Europe/London")).toStrictEqual([
        "2026-10-24T12:41",
        "2026-10-25T11:41",
        "2026-10-26T11:40",
      ]);
    });
  });

  describe("Message Style", () => {
    it("gives a Classic Reminder a scriptural saying that suits it", () => {
      const reminders = plan({ settings: everyReminderOn, days: 3 });

      expect(
        new Set(reminders.map(({ message }) => message.style))
      ).toStrictEqual(new Set(["classic"]));
      expect(sayingTopics(reminders, ["imsak"])).toStrictEqual(
        new Set(["imsak"])
      );
      expect(sayingTopics(reminders, ["fajr"])).toStrictEqual(
        new Set(["salah", "fajr"])
      );
      expect(
        sayingTopics(reminders, ["dhuhr", "asr", "maghrib", "isha"])
      ).toStrictEqual(new Set(["salah"]));
      // The sayings rotate rather than repeat one line.
      const distinct = new Set(
        reminders.map(({ message }) => message.sayingId)
      );
      expect(distinct.size).toBeGreaterThan(3);
    });

    it("picks the same saying every time it plans the same Reminder", () => {
      const first = plan({ days: 3 });
      const again = plan({ now: NOON_IN_NAJAF.add({ hours: 1 }), days: 3 });

      expect(again.map(({ message }) => message.sayingId)).toStrictEqual(
        first.map(({ message }) => message.sayingId)
      );
    });

    it("gives a Modern Reminder coaching instead of a saying", () => {
      const [reminder] = plan({ messageStyle: "modern" });

      expect(reminder?.message).toMatchObject({
        kind: "prayer-time",
        prayerTime: "maghrib",
        style: "modern",
        sayingId: null,
        minutesBefore: 5,
      });
    });
  });

  describe("At-Time Alerts", () => {
    it("plays the short takbir at Fajr, Dhuhr and Maghrib by default", () => {
      const alerts = atTime(
        plan({ settings: DEFAULT_REMINDER_SETTINGS, days: 2 })
      );

      expect(alerts.map(({ id }) => id)).toStrictEqual([
        "prayer:2026-10-15:maghrib:at-time",
        "prayer:2026-10-16:fajr:at-time",
        "prayer:2026-10-16:dhuhr:at-time",
        "prayer:2026-10-16:maghrib:at-time",
      ]);
      // At the Prayer Time itself, not minutes before.
      expect(localFireTimes(alerts)).toStrictEqual([
        "2026-10-15T17:46",
        "2026-10-16T04:45",
        "2026-10-16T11:49",
        "2026-10-16T17:44",
      ]);
      expect(new Set(alerts.map(({ alert }) => alert.kind))).toStrictEqual(
        new Set(["takbir"])
      );
    });

    it("comes as well as the Reminder before, each with its own identity", () => {
      const ids = plan({ settings: DEFAULT_REMINDER_SETTINGS, days: 1 }).map(
        ({ id }) => id
      );

      expect(ids).toStrictEqual([
        "prayer:2026-10-15:maghrib:before",
        "prayer:2026-10-15:maghrib:at-time",
      ]);
    });

    it("plays each Salah's own choice", () => {
      const settings = applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
        salah: {
          asr: { atTime: "silent" },
          maghrib: { atTime: "adhan", adhanSound: "najaf-voice" },
          isha: { atTime: "takbir" },
        },
      });

      const alerts = atTime(plan({ settings, days: 1 }));

      expect(
        alerts.map(({ message, alert }) => [message.prayerTime, alert])
      ).toStrictEqual([
        ["asr", { kind: "silent" }],
        ["maghrib", { kind: "adhan", adhanSound: "najaf-voice" }],
        ["isha", { kind: "takbir", adhanSound: "system" }],
      ]);
    });

    it("drops a Salah whose At-Time Alert is off", () => {
      const settings = applyReminderSettingsChange(DEFAULT_REMINDER_SETTINGS, {
        salah: { maghrib: { atTime: "off" } },
      });

      expect(atTime(plan({ settings, days: 1 }))).toStrictEqual([]);
    });

    it("keeps Reminders before and At-Time Alerts together within 64, the soonest", () => {
      const settings = applyReminderSettingsChange(everyReminderOn, {
        salah: Object.fromEntries(
          SALAH.map((salah) => [salah, { atTime: "takbir" }])
        ),
        imsak: { atTime: "takbir", ramadanOnly: false },
      });

      const reminders = plan({ settings, days: 14 });

      expect(reminders).toHaveLength(64);
      expect(new Set(reminders.map(({ id }) => id)).size).toBe(64);
      expect(
        new Set(reminders.map(({ message }) => message.timing))
      ).toStrictEqual(new Set(["before", "at-time"]));
      // Twelve alerts a day: the plan reaches only into the sixth day.
      expect(
        reminders.at(-1)?.fireAt.toZonedDateTimeISO("Asia/Baghdad").day
      ).toBe(20);
      const fireTimes = reminders.map(({ fireAt }) => fireAt.epochMilliseconds);
      expect(fireTimes).toStrictEqual(fireTimes.toSorted((a, b) => a - b));
    });

    describe("Imsak", () => {
      const calendar = createHijriCalendar();
      // The first of Ramadan 1448, and the day before it (Sha'ban).
      const firstOfRamadan = calendar.toGregorian({
        year: 1448,
        month: 9,
        day: 1,
      });
      const lastOfShaban = firstOfRamadan.subtract({ days: 1 });
      const imsakAlerts = (settings = DEFAULT_REMINDER_SETTINGS) =>
        atTime(
          plan({
            now: lastOfShaban.toZonedDateTime("Asia/Baghdad"),
            settings,
            days: 2,
            hijri: calendar,
          })
        )
          .filter(({ message }) => message.prayerTime === "imsak")
          .map(({ id }) => id);

      it("alerts at Imsak only on the days of Ramadan by default", () => {
        expect(imsakAlerts()).toStrictEqual([
          `prayer:${firstOfRamadan.toString()}:imsak:at-time`,
        ]);
      });

      it("alerts all year once the Believer asks for it", () => {
        const settings = applyReminderSettingsChange(
          DEFAULT_REMINDER_SETTINGS,
          { imsak: { ramadanOnly: false } }
        );

        expect(imsakAlerts(settings)).toStrictEqual([
          `prayer:${lastOfShaban.toString()}:imsak:at-time`,
          `prayer:${firstOfRamadan.toString()}:imsak:at-time`,
        ]);
      });

      it("follows the Hijri Adjustment into Ramadan", () => {
        const shifted = createHijriCalendar({ adjustment: 1 });
        const ids = atTime(
          plan({
            now: lastOfShaban.toZonedDateTime("Asia/Baghdad"),
            settings: DEFAULT_REMINDER_SETTINGS,
            days: 1,
            hijri: shifted,
          })
        )
          .filter(({ message }) => message.prayerTime === "imsak")
          .map(({ id }) => id);

        // A day later by the adjustment, the last of Sha'ban is Ramadan's 1st.
        expect(ids).toStrictEqual([
          `prayer:${lastOfShaban.toString()}:imsak:at-time`,
        ]);
      });
    });
  });

  it("plans only the sources' Reminders without a location", () => {
    const reminders = plan({
      prayerTimes: null,
      sources: [
        (window) => [
          habitAt("habit:a", window.now.add({ hours: 1 }).toInstant()),
        ],
      ],
    });

    expect(reminders.map(({ id }) => id)).toStrictEqual(["habit:a"]);
  });

  it("drops source Reminders outside the window", () => {
    const reminders = plan({
      prayerTimes: null,
      days: 1,
      sources: [
        () => [
          habitAt(
            "habit:past",
            NOON_IN_NAJAF.subtract({ hours: 1 }).toInstant()
          ),
          habitAt(
            "habit:after",
            at("2026-10-16T00:00[Asia/Baghdad]").toInstant()
          ),
        ],
      ],
    });

    expect(reminders).toStrictEqual([]);
  });
});

describe(isStaleAlert, () => {
  const fireAt = Temporal.Instant.from("2026-10-15T14:46:00Z");

  it("shows an alert delivered up to 30 minutes late", () => {
    expect(isStaleAlert(fireAt, fireAt)).toBeFalsy();
    expect(isStaleAlert(fireAt, fireAt.add({ minutes: 30 }))).toBeFalsy();
  });

  it("drops an alert that would arrive more than 30 minutes late", () => {
    expect(isStaleAlert(fireAt, fireAt.add({ minutes: 31 }))).toBeTruthy();
    expect(isStaleAlert(fireAt, fireAt.add({ hours: 5 }))).toBeTruthy();
  });
});

describe(diffSchedule, () => {
  it("cancels what changed or went, and schedules what changed or is new", () => {
    const diff = diffSchedule(
      [
        { id: "kept", fingerprint: "a" },
        { id: "changed", fingerprint: "old" },
        { id: "gone", fingerprint: "x" },
      ],
      [
        { id: "kept", fingerprint: "a" },
        { id: "changed", fingerprint: "new" },
        { id: "added", fingerprint: "y" },
      ]
    );

    expect(diff).toStrictEqual({
      cancel: ["changed", "gone"],
      schedule: [
        { id: "changed", fingerprint: "new" },
        { id: "added", fingerprint: "y" },
      ],
    });
  });
});
