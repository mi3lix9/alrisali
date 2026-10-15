import type { BelieverSettings } from "@alrisali/db-user/shared";
import { distanceKm, LOCATION_REFRESH_KM } from "@alrisali/domain/shared";
import type { Location } from "@alrisali/domain/shared";

export type Coordinates = Pick<Location, "latitude" | "longitude">;

export type FollowedLocationSettings = Pick<
  BelieverSettings,
  "location" | "locationFollowsDevice"
>;

export interface FollowedLocationDeps {
  /** The saved settings as they are now, not a render-time snapshot. */
  readSettings: () => Promise<FollowedLocationSettings>;
  /** Whether location access is already granted; never prompts. */
  permitted: () => Promise<boolean>;
  position: () => Promise<Coordinates>;
  nameOf: (coordinates: Coordinates) => Promise<string | null>;
  update: (change: Pick<BelieverSettings, "location">) => Promise<unknown>;
}

/**
 * Replaces a followed location with the device position when the device has
 * moved. The settings are read again after the GPS and geocoder answer, so a
 * location the Believer chose by hand meanwhile is never overwritten.
 */
export const refreshFollowedLocation = async ({
  readSettings,
  permitted,
  position,
  nameOf,
  update,
}: FollowedLocationDeps): Promise<void> => {
  const settings = await readSettings();
  if (!settings.locationFollowsDevice) {
    return;
  }
  if (!(await permitted())) {
    return;
  }
  const coordinates = await position();
  if (
    settings.location &&
    distanceKm(settings.location, coordinates) < LOCATION_REFRESH_KM
  ) {
    return;
  }
  const name = await nameOf(coordinates);
  const latest = await readSettings();
  if (!latest.locationFollowsDevice) {
    return;
  }
  await update({ location: { ...coordinates, name } });
};
