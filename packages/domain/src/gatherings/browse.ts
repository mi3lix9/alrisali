import type { Temporal } from "temporal-polyfill";

import type { Weekday } from "../shared";
import type { Gathering } from "./gathering";

/** How a Believer browses Gatherings. */
export const GATHERING_VIEWS = ["list", "day", "week", "month", "map"] as const;

export type GatheringView = (typeof GATHERING_VIEWS)[number];

const DAYS_PER_WEEK = 7;
const SATURDAY: Weekday = 6;

/** By date, then start time. */
export const sortGatherings = <T extends Pick<Gathering, "date" | "startTime">>(
  gatherings: readonly T[]
): T[] =>
  gatherings.toSorted(
    (a, b) =>
      a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  );

/**
 * What a Believer may see: active Gatherings, of one Speaker when a filter is
 * chosen (`null` for every Speaker), sorted.
 */
export const visibleGatherings = (
  gatherings: readonly Gathering[],
  speakerId: string | null
): Gathering[] =>
  sortGatherings(
    gatherings.filter(
      (gathering) =>
        gathering.active &&
        (speakerId === null || gathering.speakerId === speakerId)
    )
  );

/** From today on: the list view. */
export const upcomingGatherings = (
  gatherings: readonly Gathering[],
  today: Temporal.PlainDate
): Gathering[] => {
  const from = today.toString();
  return gatherings.filter((gathering) => gathering.date >= from);
};

/** Those on one day, in the order given. */
export const gatheringsOn = (
  gatherings: readonly Gathering[],
  date: Temporal.PlainDate
): Gathering[] => {
  const day = date.toString();
  return gatherings.filter((gathering) => gathering.date === day);
};

export interface GatheringDay {
  date: Temporal.PlainDate;
  gatherings: Gathering[];
}

/** The seven days of the week holding `date`, each with its Gatherings. */
export const gatheringWeek = (
  gatherings: readonly Gathering[],
  date: Temporal.PlainDate,
  { weekStartsOn = SATURDAY }: { weekStartsOn?: Weekday } = {}
): GatheringDay[] => {
  const start = date.subtract({
    days: (date.dayOfWeek - weekStartsOn + DAYS_PER_WEEK) % DAYS_PER_WEEK,
  });
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
    const day = start.add({ days: index });
    return { date: day, gatherings: gatheringsOn(gatherings, day) };
  });
};

export interface GatheringMonth {
  month: Temporal.PlainYearMonth;
  days: GatheringDay[];
  /** Rows of seven, padded with null before the 1st and after the last day. */
  weeks: (GatheringDay | null)[][];
}

/** A Gregorian month grid with each day's Gatherings. */
export const gatheringMonth = (
  gatherings: readonly Gathering[],
  month: Temporal.PlainYearMonth,
  { weekStartsOn = SATURDAY }: { weekStartsOn?: Weekday } = {}
): GatheringMonth => {
  const first = month.toPlainDate({ day: 1 });
  const days = Array.from({ length: month.daysInMonth }, (_, index) => {
    const day = first.add({ days: index });
    return { date: day, gatherings: gatheringsOn(gatherings, day) };
  });
  const leading =
    (first.dayOfWeek - weekStartsOn + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const cells: (GatheringDay | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...days,
  ];
  while (cells.length % DAYS_PER_WEEK !== 0) {
    cells.push(null);
  }
  const weeks = Array.from(
    { length: cells.length / DAYS_PER_WEEK },
    (_, week) => cells.slice(week * DAYS_PER_WEEK, (week + 1) * DAYS_PER_WEEK)
  );
  return { month, days, weeks };
};

/** Where a map camera looks: a point and a zoom level (0 is the world). */
export interface MapCamera {
  coordinates: { latitude: number; longitude: number };
  zoom: number;
}

/** A single venue, or venues very close together, at street level. */
const MAX_ZOOM = 15;
/** Room around the outermost venues, as a share of their span. */
const PADDING = 1.4;
const WORLD_DEGREES = 360;

/**
 * A camera showing every Gathering's venue, `null` when there are none. The
 * zoom is the largest at which the venues' span (padded) still fits: each
 * zoom level halves the degrees the map spans.
 */
export const cameraFor = (
  gatherings: readonly Pick<Gathering, "venue">[]
): MapCamera | null => {
  if (gatherings.length === 0) {
    return null;
  }
  const latitudes = gatherings.map(({ venue }) => venue.latitude);
  const longitudes = gatherings.map(({ venue }) => venue.longitude);
  const [south, north] = [Math.min(...latitudes), Math.max(...latitudes)];
  const [west, east] = [Math.min(...longitudes), Math.max(...longitudes)];
  const span = Math.max(north - south, east - west) * PADDING;
  const zoom =
    span === 0 ? MAX_ZOOM : Math.min(MAX_ZOOM, Math.log2(WORLD_DEGREES / span));
  return {
    coordinates: {
      latitude: (north + south) / 2,
      longitude: (east + west) / 2,
    },
    zoom: Math.max(0, zoom),
  };
};
