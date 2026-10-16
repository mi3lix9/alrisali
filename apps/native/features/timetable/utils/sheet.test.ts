import {
  calculatePrayerTimes,
  createHijriCalendar,
} from "@alrisali/domain/shared";
import type { PrayerTimesSettings } from "@alrisali/domain/shared";
import { monthlyTimetable, ramadanImsakiyya } from "@alrisali/domain/timetable";
import type { TimetablePlace } from "@alrisali/domain/timetable";
import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_COLUMNS,
  imsakiyyaSheetRows,
  monthlySheetRows,
  orderedColumns,
  sheetHeight,
  sheetImageSize,
} from "./sheet";
import type { Sheet, SheetWriter } from "./sheet";
import { sheetHtml } from "./sheet-html";

const settings: PrayerTimesSettings = {
  coordinates: { latitude: 26.5652, longitude: 50.0124 },
  calculationMethod: "jafari",
  imsakMinutes: 10,
};
const place: TimetablePlace = {
  calendar: createHijriCalendar(),
  timeZone: "Asia/Riyadh",
  settings,
};

const writer: SheetWriter = {
  time: (time) =>
    time ? time.toPlainTime().toString({ smallestUnit: "minute" }) : "—",
  number: String,
  gregorianDay: (date, withMonth) =>
    withMonth ? `${date.day}/${date.month}` : String(date.day),
  hijriDay: (hijri, withMonth) =>
    withMonth ? `${hijri.day}/h${hijri.month}` : String(hijri.day),
};

describe(monthlySheetRows, () => {
  const month = { kind: "gregorian", year: 2026, month: 3 } as const;
  const rows = monthlyTimetable(month, place);
  const today = Temporal.PlainDate.from("2026-03-10");
  const sheet = monthlySheetRows(month, rows, DEFAULT_COLUMNS, today, writer);

  it("has a row per day with a date pair and a time per column", () => {
    expect(sheet).toHaveLength(31);
    expect(sheet.every(({ cells }) => cells.length === 2 + 6)).toBeTruthy();
  });

  it("writes each time as the domain Prayer Time of its date", () => {
    const row = sheet.at(13);
    const times = calculatePrayerTimes(
      Temporal.PlainDate.from("2026-03-14"),
      place.timeZone,
      settings
    );
    expect(row?.cells.slice(2)).toStrictEqual(
      DEFAULT_COLUMNS.map((name) => writer.time(times[name]))
    );
  });

  it("names the month on the first row and where it turns over", () => {
    expect(sheet[0]?.cells[0]).toBe("1/3");
    expect(sheet[1]?.cells[0]).toBe("2");
  });

  it("marks today and Fridays", () => {
    expect(sheet[9]?.mark).toBe("today");
    // 2026-03-06 is a Friday.
    expect(sheet[5]?.mark).toBe("friday");
    expect(sheet[6]?.mark).toBeUndefined();
  });

  it("puts the Hijri date first for a Hijri month", () => {
    const hijri = { kind: "hijri", year: 1447, month: 9 } as const;
    const [first] = monthlySheetRows(
      hijri,
      monthlyTimetable(hijri, place),
      ["fajr"],
      today,
      writer
    );
    expect(first?.cells[0]).toBe("1/h9");
  });
});

describe(orderedColumns, () => {
  it("keeps the chosen Prayer Times in the order of the day", () => {
    expect(orderedColumns(["maghrib", "imsak", "fajr"])).toStrictEqual([
      "imsak",
      "fajr",
      "maghrib",
    ]);
  });
});

describe(imsakiyyaSheetRows, () => {
  const rows = ramadanImsakiyya(1447, place);
  const first = rows[0]?.date ?? Temporal.PlainDate.from("2026-02-18");
  const sheet = imsakiyyaSheetRows(rows, first, writer, "Qadr");

  it("gives Imsak, Fajr, Dhuhr and Iftar for each day", () => {
    expect(sheet[0]?.cells).toHaveLength(6);
    expect(sheet[0]?.cells[2]).toBe(writer.time(rows[0]?.imsak ?? null));
    expect(sheet[0]?.cells[5]).toBe(writer.time(rows[0]?.iftar ?? null));
  });

  it("tags the Qadr nights and marks today", () => {
    expect(
      sheet.flatMap(({ tag }, index) => (tag ? [index + 1] : []))
    ).toStrictEqual([19, 21, 23]);
    expect(sheet[0]?.mark).toBe("today");
    expect(sheet[18]?.mark).toBe("qadr");
  });
});

describe(sheetImageSize, () => {
  it("keeps the sheet's proportions at 1080 pixels wide", () => {
    const { width, height } = sheetImageSize(31);
    expect(width).toBe(1080);
    expect(height / width).toBeCloseTo(sheetHeight(31) / 420, 2);
  });
});

describe(sheetHtml, () => {
  const sheet: Sheet = {
    title: "Prayer <times>",
    subtitle: "A & B",
    headers: ["Day", "Fajr"],
    rows: [{ cells: ["1", "04:50"], mark: "qadr", tag: "Qadr" }],
  };

  it("holds every cell and escapes the text", () => {
    const html = sheetHtml(sheet, "ltr");
    expect(html).toContain("Prayer &lt;times&gt;");
    expect(html).toContain("A &amp; B");
    expect(html).toContain("<td>04:50</td>");
    expect(html).toContain("<small>Qadr</small>");
  });

  it("is right to left for Arabic", () => {
    expect(sheetHtml(sheet, "rtl")).toContain('dir="rtl"');
  });
});
