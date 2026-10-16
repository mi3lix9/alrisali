import type { HijriDate, PrayerTimeName } from "../shared";
import type { WidgetEntry, WidgetKind } from "./widgets";

/**
 * The widget sizes, small to large. iOS tells the layout its family; Android
 * gives it none, so the app's props carry the size the widget was added at.
 */
export type WidgetSize = 1 | 2 | 3;

export type WidgetTone = "normal" | "muted" | "accent";

/**
 * One piece of a widget. A widget's layout runs in an isolated runtime with no
 * app code, so it only draws blocks, in order, those that fit its size.
 */
export type WidgetBlock =
  | {
      type: "text";
      text: string;
      style: "caption" | "body" | "title" | "hero" | "quran";
      tone: WidgetTone;
      /** The smallest size that shows it. */
      min: WidgetSize;
    }
  | {
      type: "countdown";
      /** Epoch milliseconds the countdown ends. */
      to: number;
      /**
       * Shown where the layout cannot tick (Android) until the last
       * `window` milliseconds: the clock time.
       */
      text: string;
      /**
       * Android: within this many milliseconds of `to`, the layout shows the
       * minutes left, which the app's per-minute refresh alarms keep right.
       */
      window: number;
      /** The ten digits in the Believer's numerals, for the minutes left. */
      digits: readonly string[];
      /** The minutes left in words, with `{time}` where they go: "in {time}". */
      remaining: string;
      min: WidgetSize;
    }
  | {
      type: "row";
      label: string;
      value: string;
      /** The row in force now. */
      strong: boolean;
      min: WidgetSize;
    }
  | {
      type: "progress";
      /** 0 to 1. */
      value: number;
      min: WidgetSize;
    };

/** What a widget shows from `from` on, and where a tap on it goes. */
export interface WidgetView {
  from: number;
  /** An `alrisali://` URL. */
  link: string;
  blocks: WidgetBlock[];
}

/**
 * The props every widget layout receives. A layout draws the view in force at
 * the moment it renders: the last whose `from` has passed. On iOS the system
 * renders at every `from` (one timeline entry each); on Android the app's
 * alarm at each `from` re-renders it.
 */
export interface WidgetProps {
  size: WidgetSize;
  views: WidgetView[];
}

/** The words a widget shows, in the Believer's language and digits. */
export interface WidgetText {
  titles: Record<WidgetKind, string>;
  prayerName: (name: PrayerTimeName) => string;
  /** A clock time in the Believer's format, in `timeZone`. */
  clock: (at: number, timeZone: string) => string;
  /** The ten digits, 0 to 9, in the Believer's numerals. */
  digits: readonly string[];
  /** "in 0:45": the time left (hours:minutes), in words. */
  remaining: (time: string) => string;
  noLocation: string;
  /** "Then Sunrise 06:30". */
  following: (prayer: string, time: string) => string;
  hijriDay: (date: HijriDate) => string;
  /** "Jumada al-Ula 1448 AH". */
  hijriMonthYear: (date: HijriDate) => string;
  /** A day (ISO `YYYY-MM-DD`) in words. */
  gregorianDate: (date: string) => string;
  /** "Al-Baqarah 2:255". */
  reference: (surah: number, ayah: number) => string;
  page: (page: number) => string;
  startReading: string;
  khatmahProgress: (done: number, total: number) => string;
  /** "Today: Al-Baqarah 1:1 – 2:141". */
  khatmahToday: (portion: string) => string;
  khatmahDoneToday: string;
  /** "2 sessions behind"; empty when on track. */
  khatmahState: (state: "ahead" | "behind", sessions: number) => string;
  startKhatmah: string;
}

/** Where a tap goes: the app's own `alrisali://` URLs, built by the app. */
export interface WidgetLinks {
  nextSalah: string;
  calendar: string;
  /** The reader, at the Last-Read Ayah. */
  quran: string;
  /** The reader, at an ayah (`surah:ayah`). */
  ayah: (key: string) => string;
  /** The Khatmah screen, or one Khatmah by id. */
  khatmah: (id?: string) => string;
}

/**
 * Android widgets cannot tick: in the last hour before a Prayer Time they
 * show the minutes left, drawn again every minute by an alarm; earlier, the
 * Prayer Time's clock time (a minute-by-minute refresh all day would cost
 * the battery more than a glance at a distant time is worth).
 */
export const COUNTDOWN_WINDOW_MS = 60 * 60_000;

/**
 * The minutes at which Android redraws the widgets to keep the countdown
 * right: each minute of the countdown window before every Prayer Time the
 * entries name, after `after` (epoch milliseconds).
 */
export const countdownTicks = (
  entries: readonly WidgetEntry[],
  after: number
): number[] => {
  const arrivals = new Set(
    entries.flatMap(({ next }) => (next ? [next.at] : []))
  );
  const ticks = new Set<number>();
  for (const at of arrivals) {
    for (let left = 1; left <= COUNTDOWN_WINDOW_MS / 60_000; left += 1) {
      const tick = at - left * 60_000;
      if (tick > after) {
        ticks.add(tick);
      }
    }
  }
  return [...ticks].toSorted((a, b) => a - b);
};

const text = (
  value: string,
  style: Extract<WidgetBlock, { type: "text" }>["style"],
  min: WidgetSize,
  tone: WidgetTone = "normal"
): WidgetBlock => ({ type: "text", text: value, style, tone, min });

// The ayah-end sign (U+06DD) and the ayah number after it end every ayah's
// text; the widget shows the words only.
const AYAH_END_SIGN = /\u06DD.*$/u;
const verseWords = (verse: string): string =>
  verse.replace(AYAH_END_SIGN, "").trim();

const nextSalah = (
  entry: WidgetEntry,
  words: WidgetText,
  links: WidgetLinks
): WidgetView => {
  const { next } = entry;
  const target = links.nextSalah;
  if (!next) {
    return {
      from: entry.from,
      link: target,
      blocks: [
        text(words.titles["next-salah"], "caption", 1, "muted"),
        text(words.noLocation, "body", 1),
      ],
    };
  }
  const clock = words.clock(next.at, entry.timeZone);
  const after = entry.times.find(({ at }) => at > next.at);
  return {
    from: entry.from,
    link: target,
    blocks: [
      text(words.titles["next-salah"], "caption", 1, "muted"),
      text(words.prayerName(next.name), "title", 1, "accent"),
      {
        type: "countdown",
        to: next.at,
        text: clock,
        window: COUNTDOWN_WINDOW_MS,
        digits: words.digits,
        remaining: words.remaining("{time}"),
        min: 1,
      },
      text(clock, "body", 2, "muted"),
      ...(after
        ? [
            text(
              words.following(
                words.prayerName(after.name),
                words.clock(after.at, entry.timeZone)
              ),
              "caption",
              2,
              "muted"
            ),
          ]
        : []),
    ],
  };
};

const todayTimes = (
  entry: WidgetEntry,
  words: WidgetText,
  links: WidgetLinks
): WidgetView => ({
  from: entry.from,
  link: links.nextSalah,
  blocks: [
    text(words.titles["today-times"], "caption", 1, "muted"),
    ...(entry.times.length === 0
      ? [text(words.noLocation, "body", 1)]
      : entry.times.map((time): WidgetBlock => ({
          type: "row",
          label: words.prayerName(time.name),
          value: words.clock(time.at, entry.timeZone),
          strong: time.name === entry.current,
          min: 1,
        }))),
  ],
});

const hijriDate = (
  entry: WidgetEntry,
  words: WidgetText,
  links: WidgetLinks
): WidgetView => ({
  from: entry.from,
  link: links.calendar,
  blocks: [
    text(words.titles["hijri-date"], "caption", 1, "muted"),
    text(words.hijriDay(entry.hijri), "hero", 1, "accent"),
    text(words.hijriMonthYear(entry.hijri), "title", 1),
    text(words.gregorianDate(entry.date), "caption", 2, "muted"),
  ],
});

const verseOfTheDay = (
  entry: WidgetEntry,
  words: WidgetText,
  links: WidgetLinks
): WidgetView => ({
  from: entry.from,
  link: links.ayah(entry.verse.key),
  blocks: [
    text(words.titles["verse-of-the-day"], "caption", 1, "muted"),
    text(verseWords(entry.verse.text), "quran", 1),
    text(
      words.reference(entry.verse.surah, entry.verse.ayah),
      "caption",
      1,
      "accent"
    ),
  ],
});

const keepReading = (
  entry: WidgetEntry,
  words: WidgetText,
  links: WidgetLinks
): WidgetView => {
  const ayah = entry.lastRead;
  return {
    from: entry.from,
    link: links.quran,
    blocks: ayah
      ? [
          text(words.titles["keep-reading"], "caption", 1, "muted"),
          text(words.reference(ayah.surah, ayah.ayah), "title", 1, "accent"),
          text(words.page(ayah.page), "body", 1, "muted"),
        ]
      : [
          text(words.titles["keep-reading"], "caption", 1, "muted"),
          text(words.startReading, "title", 1),
        ],
  };
};

const referenceOf = (key: string, words: WidgetText): string => {
  const [surah = 0, ayah = 0] = key.split(":").map(Number);
  return words.reference(surah, ayah);
};

const khatmah = (
  entry: WidgetEntry,
  words: WidgetText,
  links: WidgetLinks
): WidgetView => {
  const reading = entry.khatmah;
  if (!reading) {
    return {
      from: entry.from,
      link: links.khatmah(),
      blocks: [
        text(words.titles.khatmah, "caption", 1, "muted"),
        text(words.startKhatmah, "title", 1),
      ],
    };
  }
  let todayLine: WidgetBlock[] = [];
  if (reading.completedToday) {
    todayLine = [text(words.khatmahDoneToday, "body", 1, "muted")];
  } else if (reading.current) {
    const { from, to } = reading.current;
    const portion = `${referenceOf(from, words)} – ${referenceOf(to, words)}`;
    todayLine = [text(words.khatmahToday(portion), "body", 2)];
  }
  const state =
    reading.state === "ahead" || reading.state === "behind"
      ? words.khatmahState(reading.state, reading.sessions)
      : "";
  return {
    from: entry.from,
    link: links.khatmah(reading.id),
    blocks: [
      text(words.titles.khatmah, "caption", 1, "muted"),
      text(
        words.khatmahProgress(reading.done, reading.total),
        "title",
        1,
        "accent"
      ),
      {
        type: "progress",
        value: reading.total === 0 ? 0 : reading.done / reading.total,
        min: 1,
      },
      ...todayLine,
      ...(state ? [text(state, "caption", 2, "muted")] : []),
    ],
  };
};

const BUILDERS: Record<
  WidgetKind,
  (entry: WidgetEntry, words: WidgetText, links: WidgetLinks) => WidgetView
> = {
  "next-salah": nextSalah,
  "today-times": todayTimes,
  "hijri-date": hijriDate,
  "verse-of-the-day": verseOfTheDay,
  "keep-reading": keepReading,
  khatmah,
};

/**
 * What one widget shows for every entry of the timeline. `size` is the size
 * an Android widget is added at; iOS ignores it.
 */
export const widgetProps = (
  kind: WidgetKind,
  entries: readonly WidgetEntry[],
  words: WidgetText,
  links: WidgetLinks,
  size: WidgetSize
): WidgetProps => ({
  size,
  views: entries.map((entry) => BUILDERS[kind](entry, words, links)),
});
