import { Temporal } from "temporal-polyfill";
import { describe, expect, it } from "vitest";

import {
  cameraFor,
  gatheringMonth,
  gatheringsOn,
  gatheringWeek,
  upcomingGatherings,
  visibleGatherings,
} from "./browse";
import { gatheringSchema, localized } from "./gathering";
import type { Gathering } from "./gathering";

const gathering = (
  overrides: Partial<Gathering> & { id: string }
): Gathering => ({
  title: { ar: "مجلس", en: "" },
  description: { ar: "", en: "" },
  type: "majlis",
  date: "2026-10-15",
  startTime: "19:30",
  endTime: null,
  venue: {
    name: { ar: "الحسينية", en: "Husseiniya" },
    address: "",
    latitude: 26.43,
    longitude: 50.1,
  },
  speakerId: null,
  livestreamUrl: null,
  attendance: "everyone",
  active: true,
  ...overrides,
});

const day = (iso: string) => Temporal.PlainDate.from(iso);
const ids = (gatherings: readonly Gathering[]) =>
  gatherings.map(({ id }) => id);

describe("a Gathering", () => {
  it("accepts a Gathering as Admins publish it", () => {
    expect(
      gatheringSchema.safeParse(
        gathering({ id: "g1", livestreamUrl: "https://youtu.be/live" })
      ).success
    ).toBeTruthy();
  });

  it.each([
    ["a day the calendar lacks", { date: "2026-02-30" }],
    ["a time past midnight", { startTime: "24:10" }],
    ["an end before the start", { endTime: "18:00" }],
    ["a livestream that is not a web link", { livestreamUrl: "ftp://x.org" }],
    ["an untitled Gathering", { title: { ar: " ", en: "" } }],
  ])("refuses %s", (_, overrides) => {
    expect(
      gatheringSchema.safeParse(gathering({ id: "g1", ...overrides })).success
    ).toBeFalsy();
  });

  it("shows Arabic when there is no English", () => {
    expect(localized({ ar: "مجلس", en: "" }, "en")).toBe("مجلس");
    expect(localized({ ar: "مجلس", en: "Majlis" }, "en")).toBe("Majlis");
    expect(localized({ ar: "مجلس", en: "Majlis" }, "ar")).toBe("مجلس");
  });
});

describe("browsing Gatherings", () => {
  const all = [
    gathering({ id: "late", date: "2026-10-16", startTime: "21:00" }),
    gathering({ id: "early", date: "2026-10-16", startTime: "08:00" }),
    gathering({ id: "past", date: "2026-10-01", speakerId: "s1" }),
    gathering({ id: "hidden", date: "2026-10-16", active: false }),
    gathering({ id: "speaker", date: "2026-10-20", speakerId: "s1" }),
  ];

  it("shows active Gatherings by date and time", () => {
    expect(ids(visibleGatherings(all, null))).toStrictEqual([
      "past",
      "early",
      "late",
      "speaker",
    ]);
  });

  it("filters by Speaker", () => {
    expect(ids(visibleGatherings(all, "s1"))).toStrictEqual([
      "past",
      "speaker",
    ]);
  });

  it("lists from today on", () => {
    expect(
      ids(upcomingGatherings(visibleGatherings(all, null), day("2026-10-16")))
    ).toStrictEqual(["early", "late", "speaker"]);
  });

  it("shows one day", () => {
    expect(
      ids(gatheringsOn(visibleGatherings(all, null), day("2026-10-16")))
    ).toStrictEqual(["early", "late"]);
  });

  it("shows the week from Saturday", () => {
    const week = gatheringWeek(visibleGatherings(all, null), day("2026-10-16"));

    expect(week.map(({ date }) => date.toString())).toStrictEqual([
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
    ]);
    expect(ids(week[6]?.gatherings ?? [])).toStrictEqual(["early", "late"]);
  });

  it("lays out the month in weeks from Saturday", () => {
    const month = gatheringMonth(
      visibleGatherings(all, null),
      Temporal.PlainYearMonth.from("2026-10")
    );

    // 1 October 2026 is a Thursday: five blanks before it.
    expect(
      month.weeks[0]?.slice(0, 6).map((cell) => cell?.date.day ?? null)
    ).toStrictEqual([null, null, null, null, null, 1]);
    expect(month.days).toHaveLength(31);
    expect(month.weeks.map((week) => week.length)).toStrictEqual(
      month.weeks.map(() => 7)
    );
    expect(ids(month.days[19]?.gatherings ?? [])).toStrictEqual(["speaker"]);
  });
});

/** A Gathering at a venue with these coordinates. */
const at = (latitude: number, longitude: number) =>
  gathering({
    id: `${latitude},${longitude}`,
    venue: { name: { ar: "x", en: "" }, address: "", latitude, longitude },
  });

describe("the map", () => {
  it("has nothing to show without Gatherings", () => {
    expect(cameraFor([])).toBeNull();
  });

  it("looks at a single venue at street level", () => {
    expect(cameraFor([at(26.43, 50.1)])).toStrictEqual({
      coordinates: { latitude: 26.43, longitude: 50.1 },
      zoom: 15,
    });
  });

  it("frames every venue", () => {
    const camera = cameraFor([at(26, 50), at(27, 49)]);

    expect(camera?.coordinates).toStrictEqual({
      latitude: 26.5,
      longitude: 49.5,
    });
    // 1° padded to 1.4° fits at zoom log2(360 / 1.4) ≈ 8.
    expect(camera?.zoom).toBeCloseTo(8, 0);
  });
});
