import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import { createHijriCalendar, DEFAULT_IMSAK_MINUTES } from "../shared";
import type { PrayerTimeName } from "../shared";
import { COUNTDOWN_WINDOW_MS, countdownTicks, widgetProps } from "./view";
import type { WidgetBlock, WidgetLinks, WidgetText } from "./view";
import { WIDGET_HORIZON_HOURS, WIDGET_KINDS, widgetEntries } from "./widgets";
import type { WidgetInput, WidgetKhatmah } from "./widgets";

const DAYS = WIDGET_HORIZON_HOURS / 24;
// Qatif, Saudi Arabia: Asia/Riyadh, UTC+3 all year.
const QATIF = { latitude: 26.5652, longitude: 50.0124 };
const HIDDEN: PrayerTimeName[] = ["imsak", "asr", "sunset", "isha"];

// The Quran and the Khatmah are the app's to supply: the day of the month
// stands in for a different ayah each day.
const KHATMAH: WidgetKhatmah = {
  id: "k1",
  state: "behind",
  done: 1,
  total: 30,
  pagesRead: 20,
  completedToday: false,
  sessions: 2,
  current: { number: 2, from: "2:142", to: "2:252", pages: 20 },
};

const input = (overrides: Partial<WidgetInput> = {}): WidgetInput => ({
  prayerTimes: {
    settings: {
      coordinates: QATIF,
      calculationMethod: "jafari",
      imsakMinutes: DEFAULT_IMSAK_MINUTES,
    },
    hidden: HIDDEN,
  },
  deviceTimeZone: "Europe/London",
  hijri: createHijriCalendar(),
  verse: (date) => ({
    key: `2:${date.day}`,
    surah: 2,
    ayah: date.day,
    text: `آية ${date.day} \u06DD${date.day}`,
  }),
  lastRead: null,
  khatmah: () => null,
  ...overrides,
});

const NOW = Temporal.ZonedDateTime.from(
  "2026-10-16T10:00:00+03:00[Asia/Riyadh]"
).toInstant();

const riyadh = (iso: string): number =>
  Temporal.ZonedDateTime.from(`${iso}[Asia/Riyadh]`).epochMilliseconds;

describe(widgetEntries, () => {
  const entries = widgetEntries(input(), NOW);

  it("starts with an entry for now", () => {
    expect(entries[0]?.from).toBe(NOW.epochMilliseconds);
  });

  it("has an entry at each visible Prayer Time in the horizon", () => {
    const reached = new Set(entries.slice(1).map(({ current }) => current));
    for (const name of ["fajr", "sunrise", "dhuhr", "maghrib", "midnight"]) {
      expect(reached).toContain(name);
    }
    // Isha is hidden: it never makes an entry.
    expect(reached).not.toContain("isha");
  });

  it("has an entry at each of the place's midnights in the horizon", () => {
    const midnights = entries.filter(({ from }) => {
      const local =
        Temporal.Instant.fromEpochMilliseconds(from).toZonedDateTimeISO(
          "Asia/Riyadh"
        );
      return local.equals(local.startOfDay());
    });
    expect(midnights).toHaveLength(DAYS);
  });

  it("is in order, within the horizon, and never repeats an instant", () => {
    const froms = entries.map(({ from }) => from);
    expect(froms).toStrictEqual(froms.toSorted((a, b) => a - b));
    expect(new Set(froms).size).toBe(froms.length);
    expect(froms.at(-1)).toBeLessThanOrEqual(
      NOW.epochMilliseconds + WIDGET_HORIZON_HOURS * 3_600_000
    );
  });

  it("names, at each entry, the next Prayer Time after it", () => {
    for (const entry of entries) {
      expect(entry.next?.at).toBeGreaterThan(entry.from);
    }
  });

  it("switches the next Salah at the Prayer Time itself", () => {
    const [first, second] = entries;
    expect(second?.from).toBe(first?.next?.at);
    // The moment it is reached, that Prayer Time is current and the next moved on.
    expect(second?.current).toBe(first?.next?.name);
    expect(second?.next?.at).toBeGreaterThan(second?.from ?? 0);
  });

  it("lists the day's visible times on the place's clock", () => {
    const [first] = entries;
    expect(first?.timeZone).toBe("Asia/Riyadh");
    expect(first?.date).toBe("2026-10-16");
    expect(first?.times.map(({ name }) => name)).toStrictEqual([
      "fajr",
      "sunrise",
      "dhuhr",
      "maghrib",
      "midnight",
    ]);
  });

  it("turns the day at the place's midnight, not the device's", () => {
    const turned = entries.find(({ date }) => date === "2026-10-17");
    expect(turned?.from).toBe(riyadh("2026-10-17T00:00:00+03:00"));
    expect(turned?.hijri).toStrictEqual(
      createHijriCalendar().toHijri(Temporal.PlainDate.from("2026-10-17"))
    );
  });

  it("carries the Verse of the Day of each day", () => {
    const today = entries.find(({ date }) => date === "2026-10-16");
    const tomorrow = entries.find(({ date }) => date === "2026-10-17");
    expect(today?.verse.key).toBe("2:16");
    expect(tomorrow?.verse.key).toBe("2:17");
  });

  it("turns the day at the device's midnight, with no Prayer Times, without a location", () => {
    const none = widgetEntries(input({ prayerTimes: null }), NOW);
    expect(
      none.every(({ next, times }) => next === null && times.length === 0)
    ).toBeTruthy();
    expect(none.map(({ date }) => date)).toStrictEqual(
      Array.from({ length: DAYS + 1 }, (_, index) =>
        Temporal.PlainDate.from("2026-10-16").add({ days: index }).toString()
      )
    );
    expect(none[0]?.timeZone).toBe("Europe/London");
  });

  it("carries the Last-Read Ayah and the Khatmah of each day", () => {
    const lastRead = { surah: 2, ayah: 255, page: 42 };
    const withData = widgetEntries(
      input({
        lastRead,
        khatmah: (date) => (date.day === 16 ? KHATMAH : null),
      }),
      NOW
    );
    expect(withData[0]?.lastRead).toStrictEqual(lastRead);
    expect(withData[0]?.khatmah).toStrictEqual(KHATMAH);
    expect(
      withData.find(({ date }) => date === "2026-10-17")?.khatmah
    ).toBeNull();
  });
});

const WORDS: WidgetText = {
  digits: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  remaining: (time) => `in ${time}`,
  titles: {
    "next-salah": "Next prayer",
    "today-times": "Today",
    "hijri-date": "Hijri date",
    "verse-of-the-day": "Verse of the Day",
    "keep-reading": "Keep reading",
    khatmah: "Khatmah",
  },
  prayerName: (name) => name,
  clock: (at, timeZone) =>
    Temporal.Instant.fromEpochMilliseconds(at)
      .toZonedDateTimeISO(timeZone)
      .toPlainTime()
      .toString({ smallestUnit: "minute" }),
  noLocation: "Choose a place",
  following: (prayer, time) => `Then ${prayer} ${time}`,
  hijriDay: ({ day }) => String(day),
  hijriMonthYear: ({ month, year }) => `${month}/${year}`,
  gregorianDate: (date) => date,
  reference: (surah, ayah) => `${surah}:${ayah}`,
  page: (page) => `Page ${page}`,
  startReading: "Start reading",
  khatmahProgress: (done, total) => `${done}/${total}`,
  khatmahToday: (portion) => `Today ${portion}`,
  khatmahDoneToday: "Done today",
  khatmahState: (state, sessions) => `${state} ${sessions}`,
  startKhatmah: "Start a Khatmah",
};

const LINKS: WidgetLinks = {
  nextSalah: "app://next-salah",
  calendar: "app://calendar",
  quran: "app://quran",
  ayah: (key) => `app://ayah/${key}`,
  khatmah: (id) => (id === undefined ? "app://khatmah" : `app://khatmah/${id}`),
};

const viewsOf = (
  kind: (typeof WIDGET_KINDS)[number],
  data: WidgetInput = input()
) => widgetProps(kind, widgetEntries(data, NOW), WORDS, LINKS, 1).views;

const blocksOf = (
  kind: (typeof WIDGET_KINDS)[number],
  data: WidgetInput = input()
): WidgetBlock[] => viewsOf(kind, data)[0]?.blocks ?? [];

const hasText = (blocks: readonly WidgetBlock[], wanted: string): boolean =>
  blocks.some((block) => block.type === "text" && block.text === wanted);

/** Only what survives the trip to the widget as JSON, unchanged. */
const isPlainData = (value: unknown): boolean => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every(isPlainData);
  }
  return (
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.values(value).every(isPlainData)
  );
};

describe(widgetProps, () => {
  it("makes one view per entry, at the entry's moment", () => {
    const entries = widgetEntries(input(), NOW);
    for (const kind of WIDGET_KINDS) {
      const { views } = widgetProps(kind, entries, WORDS, LINKS, 2);
      expect(views.map(({ from }) => from)).toStrictEqual(
        entries.map(({ from }) => from)
      );
    }
  });

  it("counts down to the next Prayer Time, giving its clock time where it cannot tick", () => {
    const [first] = widgetEntries(input(), NOW);
    expect(
      blocksOf("next-salah").find(({ type }) => type === "countdown")
    ).toMatchObject({
      to: first?.next?.at,
      text: expect.stringMatching(/^\d\d:\d\d$/u),
      window: COUNTDOWN_WINDOW_MS,
      remaining: "in {time}",
    });
  });

  it("redraws the Android countdown each minute of the hour before a Prayer Time", () => {
    const entries = widgetEntries(input(), NOW);
    const [first] = entries;
    const at = first?.next?.at ?? 0;
    const ticks = countdownTicks(entries, NOW.epochMilliseconds);
    const before = ticks.filter((tick) => tick < at && tick >= at - 3_600_000);

    expect(before.length).toBeLessThanOrEqual(60);
    expect(before.at(-1)).toBe(at - 60_000);
    expect(ticks.every((tick) => tick > NOW.epochMilliseconds)).toBeTruthy();
    expect(ticks).toStrictEqual(ticks.toSorted((a, b) => a - b));
    expect(new Set(ticks).size).toBe(ticks.length);
  });

  it("shows the following Prayer Time on larger sizes only", () => {
    const then = blocksOf("next-salah").find(
      (block) => block.type === "text" && block.text.startsWith("Then ")
    );
    expect(then).toMatchObject({ min: 2 });
  });

  it("asks for a place when there is none", () => {
    for (const kind of ["next-salah", "today-times"] as const) {
      expect(
        hasText(blocksOf(kind, input({ prayerTimes: null })), "Choose a place")
      ).toBeTruthy();
    }
  });

  it("lists today's times and marks the Prayer Time in force", () => {
    const rows = blocksOf("today-times").flatMap((block) =>
      block.type === "row" ? [block] : []
    );
    expect(rows.map(({ label }) => label)).toStrictEqual([
      "fajr",
      "sunrise",
      "dhuhr",
      "maghrib",
      "midnight",
    ]);
    // 10:00: Sunrise has passed, Dhuhr is not yet.
    expect(
      rows.filter(({ strong }) => strong).map(({ label }) => label)
    ).toStrictEqual(["sunrise"]);
  });

  it("shows the Verse of the Day's words without its end sign and number", () => {
    const verse = blocksOf("verse-of-the-day").find(
      (block) => block.type === "text" && block.style === "quran"
    );
    expect(verse).toMatchObject({ text: "آية 16" });
  });

  it("shows the Last-Read Ayah the reader holds, and invites reading before any", () => {
    const lastRead = { surah: 2, ayah: 255, page: 42 };
    const holding = blocksOf("keep-reading", input({ lastRead }));
    expect(hasText(holding, "2:255")).toBeTruthy();
    expect(hasText(holding, "Page 42")).toBeTruthy();
    expect(hasText(blocksOf("keep-reading"), "Start reading")).toBeTruthy();
  });

  it("shows the Khatmah's progress and today's portion, or invites starting one", () => {
    const blocks = blocksOf("khatmah", input({ khatmah: () => KHATMAH }));
    expect(hasText(blocks, "1/30")).toBeTruthy();
    expect(blocks).toContainEqual({ type: "progress", value: 1 / 30, min: 1 });
    expect(hasText(blocks, "Today 2:142 – 2:252")).toBeTruthy();
    expect(hasText(blocks, "behind 2")).toBeTruthy();
    expect(hasText(blocksOf("khatmah"), "Start a Khatmah")).toBeTruthy();
  });

  it("says a Khatmah's portion is done once it is", () => {
    const done = {
      ...KHATMAH,
      completedToday: true,
      state: "on-track",
    } as const;
    const blocks = blocksOf("khatmah", input({ khatmah: () => done }));
    expect(hasText(blocks, "Done today")).toBeTruthy();
    expect(
      blocks.some(
        (block) => block.type === "text" && block.text.startsWith("Today ")
      )
    ).toBeFalsy();
  });

  it("opens the matching screen", () => {
    const data = input({
      lastRead: { surah: 18, ayah: 10, page: 293 },
      khatmah: () => KHATMAH,
    });
    const link = (kind: (typeof WIDGET_KINDS)[number]) =>
      viewsOf(kind, data)[0]?.link;
    expect(
      Object.fromEntries(WIDGET_KINDS.map((kind) => [kind, link(kind)]))
    ).toStrictEqual({
      "next-salah": LINKS.nextSalah,
      "today-times": LINKS.nextSalah,
      "hijri-date": LINKS.calendar,
      "verse-of-the-day": "app://ayah/2:16",
      "keep-reading": LINKS.quran,
      khatmah: "app://khatmah/k1",
    });
  });

  it("opens the Khatmah screen when there is no Khatmah", () => {
    expect(viewsOf("khatmah")[0]?.link).toBe(LINKS.khatmah());
  });

  it("holds only plain data a widget's isolated runtime can read", () => {
    const props = widgetProps(
      "today-times",
      widgetEntries(input(), NOW),
      WORDS,
      LINKS,
      3
    );
    expect(isPlainData(props)).toBeTruthy();
  });
});
