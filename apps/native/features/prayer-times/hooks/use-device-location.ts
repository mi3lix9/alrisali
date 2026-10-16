import type { BelieverSettings } from "@alrisali/db-user/shared";
import type { Location } from "@alrisali/domain/shared";
import { useMutation } from "@tanstack/react-query";
import {
  Accuracy,
  geocodeAsync,
  getCurrentPositionAsync,
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  reverseGeocodeAsync,
} from "expo-location";
import type { LocationGeocodedAddress } from "expo-location";
import { useEffect, useEffectEvent } from "react";
import { AppState } from "react-native";

import {
  readBelieverSettings,
  useBelieverSettings,
  useUpdateBelieverSettings,
} from "@/shared/lib/believer-settings";
import { joinParts } from "@/shared/lib/i18n";

import { useRememberCity } from "../data/recent-cities";
import { refreshFollowedLocation } from "../utils/refresh-followed-location";
import type { Coordinates } from "../utils/refresh-followed-location";

const SEARCH_RESULTS = 5;

const cityOf = (address: LocationGeocodedAddress | undefined) =>
  address
    ? (address.city ??
      address.subregion ??
      address.region ??
      address.country ??
      null)
    : null;

/** The address of a place, or undefined offline (it needs the network). */
const addressOf = async (
  coordinates: Coordinates
): Promise<LocationGeocodedAddress | undefined> => {
  try {
    const [address] = await reverseGeocodeAsync(coordinates);
    return address;
  } catch {
    return undefined;
  }
};

const devicePosition = async (): Promise<Coordinates> => {
  const { coords } = await getCurrentPositionAsync({
    accuracy: Accuracy.Balanced,
  });
  return { latitude: coords.latitude, longitude: coords.longitude };
};

export type LocateOutcome = "located" | "denied" | "unavailable";

/**
 * Asks for location access if needed, then sets the location from the GPS and
 * makes it follow the device from now on.
 */
export const useLocateDevice = () => {
  const { mutateAsync: update } = useUpdateBelieverSettings();
  return useMutation({
    mutationFn: async (): Promise<LocateOutcome> => {
      const { granted } = await requestForegroundPermissionsAsync();
      if (!granted) {
        return "denied";
      }
      let coordinates: Coordinates;
      try {
        coordinates = await devicePosition();
      } catch {
        return "unavailable";
      }
      const name = cityOf(await addressOf(coordinates));
      await update({
        location: { ...coordinates, name },
        locationFollowsDevice: true,
      });
      return "located";
    },
  });
};

export interface CityResult {
  location: Location;
  /** The city with its country, to tell same-named cities apart. */
  label: string;
}

/** Finds cities by name with the platform geocoder (needs the network). */
export const useCitySearch = () =>
  useMutation({
    mutationFn: async (query: string): Promise<CityResult[]> => {
      const found = await geocodeAsync(query.trim());
      return Promise.all(
        found.slice(0, SEARCH_RESULTS).map(async ({ latitude, longitude }) => {
          const address = await addressOf({ latitude, longitude });
          const name = cityOf(address) ?? query.trim();
          const country = address?.country;
          return {
            location: { latitude, longitude, name },
            label:
              country && country !== name ? joinParts([name, country]) : name,
          };
        })
      );
    },
  });

/** Sets a location the Believer chose; it stays put when they travel. */
export const useChooseLocation = () => {
  const { mutate: update, isPending } = useUpdateBelieverSettings();
  const { mutate: remember } = useRememberCity();
  return {
    choose: (location: Location) => {
      update({ location, locationFollowsDevice: false });
      remember(location);
    },
    isPending,
  };
};

let refreshing = false;

/** One refresh at a time: Home and the Prayer tab both ask on resume. */
const refreshOnce = async (
  update: (change: Partial<BelieverSettings>) => Promise<unknown>
): Promise<void> => {
  if (refreshing) {
    return;
  }
  refreshing = true;
  try {
    await refreshFollowedLocation({
      readSettings: readBelieverSettings,
      // Never prompts: only a Believer's tap asks for access.
      permitted: async () => {
        const { granted } = await getForegroundPermissionsAsync();
        return granted;
      },
      position: devicePosition,
      nameOf: async (coordinates) => cityOf(await addressOf(coordinates)),
      update,
    });
  } catch {
    // A failed fix keeps the saved location; the next resume retries.
  } finally {
    refreshing = false;
  }
};

/**
 * Keeps a followed location current: on launch and whenever the app returns
 * to the foreground, the GPS position replaces the saved one if the device
 * has moved. A location the Believer chose by hand is left alone.
 */
export const useFollowDeviceLocation = (): void => {
  const { data: settings } = useBelieverSettings();
  const { mutateAsync: update } = useUpdateBelieverSettings();
  const loaded = settings !== undefined;
  const refresh = useEffectEvent(() => {
    refreshOnce(update);
  });

  useEffect(() => {
    if (!loaded) {
      return;
    }
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [loaded]);
};
