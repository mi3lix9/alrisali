import { timeZoneAt } from "@alrisali/content/time-zones";

import type { Location } from "./location";

/**
 * The IANA time zone of a place, from the bundled time-zone boundaries.
 * Prayer Times and their Reminders are on this clock, never the device's, so
 * a city picked in another time zone shows its own local times.
 */
export const locationTimeZone = ({
  latitude,
  longitude,
}: Pick<Location, "latitude" | "longitude">): string =>
  timeZoneAt(latitude, longitude);
