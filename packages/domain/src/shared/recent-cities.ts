import { z } from "zod";

import { readNumber } from "./digits";
import { distanceKm, locationSchema } from "./location";
import type { Location } from "./location";
import { locationTimeZone } from "./time-zone";

/** How many Recent Cities are kept; choosing a new one pushes the oldest out. */
export const MAX_RECENT_CITIES = 5;

/** Two places closer than this are the same city, however they were typed. */
const SAME_CITY_KM = 1;

/** A city the Believer chose, with the time zone its times are on. */
export const recentCitySchema = locationSchema.extend({
  timeZone: z.string().min(1),
});

export type RecentCity = z.infer<typeof recentCitySchema>;

/** The Recent Cities as stored, skipping entries that can't be read. */
export const readRecentCities = (stored: unknown): RecentCity[] => {
  if (!Array.isArray(stored)) {
    return [];
  }
  return stored
    .flatMap((entry) => {
      const parsed = recentCitySchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    })
    .slice(0, MAX_RECENT_CITIES);
};

/** The Recent Cities with this place first, once, and its time zone resolved. */
export const rememberCity = (
  recent: readonly RecentCity[],
  location: Location
): RecentCity[] =>
  [
    { ...location, timeZone: locationTimeZone(location) },
    ...recent.filter((city) => distanceKm(city, location) >= SAME_CITY_KM),
  ].slice(0, MAX_RECENT_CITIES);

/**
 * Coordinates typed by hand: validated, with the time zone they fall in, or
 * null when either is missing or out of range.
 */
export const manualLocation = (
  latitude: string,
  longitude: string,
  name: string
): { location: Location; timeZone: string } | null => {
  const parsed = locationSchema.safeParse({
    latitude: readNumber(latitude),
    longitude: readNumber(longitude),
    name: name.trim() === "" ? null : name,
  });
  if (!parsed.success) {
    return null;
  }
  try {
    return {
      location: parsed.data,
      timeZone: locationTimeZone(parsed.data),
    };
  } catch {
    return null;
  }
};
