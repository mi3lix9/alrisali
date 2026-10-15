import type { Gathering } from "@alrisali/domain/gatherings";
import { describe, expect, it } from "vitest";

import { groupByDate } from "./group-by-date";

const gathering = (id: string, date: string): Gathering => ({
  id,
  title: { ar: "مجلس", en: "" },
  description: { ar: "", en: "" },
  type: "majlis",
  date,
  startTime: "19:30",
  endTime: null,
  venue: {
    name: { ar: "حسينية", en: "" },
    address: "",
    latitude: 0,
    longitude: 0,
  },
  speakerId: null,
  livestreamUrl: null,
  attendance: "everyone",
  active: true,
});

describe(groupByDate, () => {
  it("is empty without Gatherings", () => {
    expect(groupByDate([])).toStrictEqual([]);
  });

  it("groups consecutive Gatherings of a date, keeping their order", () => {
    const a = gathering("a", "2026-10-15");
    const b = gathering("b", "2026-10-15");
    const c = gathering("c", "2026-10-17");
    expect(groupByDate([a, b, c])).toStrictEqual([
      { date: "2026-10-15", gatherings: [a, b] },
      { date: "2026-10-17", gatherings: [c] },
    ]);
  });
});
