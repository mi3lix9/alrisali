import { PRAYER_TIMES } from "@alrisali/domain/shared";
import type { HijriDate, PrayerTimeName } from "@alrisali/domain/shared";
import type {
  ImsakiyyaRow,
  TimetableMonth,
  TimetableRow,
} from "@alrisali/domain/timetable";
import type { Temporal } from "temporal-polyfill";

/** How a row of a sheet stands out. */
export type SheetMark = "today" | "friday" | "qadr";

export interface SheetRow {
  cells: string[];
  mark?: SheetMark;
  /** A small label beside the first cell, such as the Qadr night. */
  tag?: string;
}

/**
 * A table the Believer shares, already worded and timed: the screen draws it,
 * the image captures that drawing and the PDF prints it, so all three say the
 * same thing.
 */
export interface Sheet {
  title: string;
  subtitle: string;
  headers: string[];
  rows: SheetRow[];
}

/** What a sheet needs to write dates and times for the Believer. */
export interface SheetWriter {
  /** A clock time, or the placeholder for one that never comes. */
  time: (time: Temporal.ZonedDateTime | null) => string;
  /** A whole number in the interface's digits. */
  number: (value: number) => string;
  /** A Gregorian day, with its month's name when `withMonth`. */
  gregorianDay: (date: Temporal.PlainDate, withMonth: boolean) => string;
  /** A Hijri day, with its month's name when `withMonth`. */
  hijriDay: (hijri: HijriDate, withMonth: boolean) => string;
}

/** The Prayer Times that open a monthly timetable's columns. */
export const DEFAULT_COLUMNS: readonly PrayerTimeName[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

/** The chosen columns in the order Prayer Times run through the day. */
export const orderedColumns = (
  chosen: readonly PrayerTimeName[]
): PrayerTimeName[] => PRAYER_TIMES.filter((name) => chosen.includes(name));

/**
 * A row's two date cells, the shown month's calendar first. A day carries its
 * month's name on the first row and where the month turns over.
 */
const dateCells = (
  month: TimetableMonth,
  row: TimetableRow,
  index: number,
  writer: SheetWriter
): [string, string] => {
  const gregorian = writer.gregorianDay(
    row.date,
    index === 0 || row.date.day === 1
  );
  const hijri = writer.hijriDay(row.hijri, index === 0 || row.hijri.day === 1);
  return month.kind === "gregorian" ? [gregorian, hijri] : [hijri, gregorian];
};

const FRIDAY = 5;

/** The rows of a monthly timetable as a sheet's, one cell per column. */
export const monthlySheetRows = (
  month: TimetableMonth,
  rows: readonly TimetableRow[],
  columns: readonly PrayerTimeName[],
  today: Temporal.PlainDate,
  writer: SheetWriter
): SheetRow[] =>
  rows.map((row, index) => {
    let mark: SheetMark | undefined;
    if (row.date.equals(today)) {
      mark = "today";
    } else if (row.date.dayOfWeek === FRIDAY) {
      mark = "friday";
    }
    return {
      cells: [
        ...dateCells(month, row, index, writer),
        ...columns.map((name) => writer.time(row.times[name])),
      ],
      ...(mark ? { mark } : {}),
    };
  });

/** The rows of a Ramadan Imsakiyya as a sheet's. */
export const imsakiyyaSheetRows = (
  rows: readonly ImsakiyyaRow[],
  today: Temporal.PlainDate,
  writer: SheetWriter,
  qadrTag: string
): SheetRow[] =>
  rows.map((row, index) => {
    let mark: SheetMark | undefined;
    if (row.qadrNight) {
      mark = "qadr";
    } else if (row.date.equals(today)) {
      mark = "today";
    }
    return {
      cells: [
        writer.number(row.day),
        writer.gregorianDay(row.date, index === 0 || row.date.day === 1),
        writer.time(row.imsak),
        writer.time(row.fajr),
        writer.time(row.dhuhr),
        writer.time(row.iftar),
      ],
      ...(mark ? { mark } : {}),
      ...(row.qadrNight ? { tag: qadrTag } : {}),
    };
  });

// The drawing's layout, in points. The width is fixed so the image comes out
// the same on every phone; the height follows from the row count so it can be
// worked out before anything is drawn.
export const SHEET_WIDTH = 420;
export const SHEET_PADDING = 12;
export const SHEET_TITLE_HEIGHT = 64;
export const SHEET_HEADER_HEIGHT = 32;
export const SHEET_ROW_HEIGHT = 26;

/** The height of a sheet with `rowCount` rows. */
export const sheetHeight = (rowCount: number): number =>
  SHEET_PADDING * 2 +
  SHEET_TITLE_HEIGHT +
  SHEET_HEADER_HEIGHT +
  SHEET_ROW_HEIGHT * rowCount;

/** The pixel width of a shared image: the sheet drawn at 1080 wide. */
export const SHEET_IMAGE_WIDTH = 1080;

/** The pixel size of the image of a sheet with `rowCount` rows. */
export const sheetImageSize = (
  rowCount: number
): { width: number; height: number } => ({
  width: SHEET_IMAGE_WIDTH,
  height: Math.round((sheetHeight(rowCount) * SHEET_IMAGE_WIDTH) / SHEET_WIDTH),
});

/** The sheet's colours: a light page whatever the app's theme. */
export const SHEET_COLORS = {
  page: "#ffffff",
  text: "#1b1b1f",
  muted: "#6b6b73",
  header: "#efece4",
  accent: "#0b6b4f",
  today: "#d8efe5",
  friday: "#f6f3ec",
  qadr: "#fdeccc",
  line: "#e3dfd5",
} as const;
