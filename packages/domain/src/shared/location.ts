import { z } from "zod";

const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

/** Where the Believer is: coordinates, plus a place name when one is known. */
export const locationSchema = z.object({
  latitude: z.number().min(-MAX_LATITUDE).max(MAX_LATITUDE),
  longitude: z.number().min(-MAX_LONGITUDE).max(MAX_LONGITUDE),
  name: z.string().trim().min(1).nullable(),
});

export type Location = z.infer<typeof locationSchema>;

const EARTH_RADIUS_KM = 6371;
const RADIANS = Math.PI / 180;

/** Great-circle distance between two places, in kilometres. */
export const distanceKm = (
  from: Pick<Location, "latitude" | "longitude">,
  to: Pick<Location, "latitude" | "longitude">
): number => {
  const dLatitude = (to.latitude - from.latitude) * RADIANS;
  const dLongitude = (to.longitude - from.longitude) * RADIANS;
  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(from.latitude * RADIANS) *
      Math.cos(to.latitude * RADIANS) *
      Math.sin(dLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
};

/**
 * How far the device must move before a followed location is replaced. Prayer
 * Times shift about a minute per 25 km, so smaller moves aren't worth a write.
 */
export const LOCATION_REFRESH_KM = 1;
