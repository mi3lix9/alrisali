import { useQuery } from "@tanstack/react-query";
import { reverseGeocodeAsync } from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";

import { deviceEntry } from "@/shared/lib/device-entries";

import {
  needsHighLatitudePrompt,
  readSeenCountries,
  withSeenCountry,
} from "../utils/high-latitude-prompt";

const SEEN_KEY = deviceEntry("alrisali.prayer-times.highLatitudeSeen");

const COORDINATE_DECIMALS = 1;

/** The ISO country code of a place, or null offline (it needs the network). */
const countryOf = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const [address] = await reverseGeocodeAsync({ latitude, longitude });
    return address?.isoCountryCode ?? null;
  } catch {
    return null;
  }
};

/**
 * The one-time prompt to review the high-latitude settings: `shown` once per
 * country for a location at a high latitude (`place` is null when there is none, or it is not high). It is remembered on the device when it first shows, so
 * dismissing and opening Prayer settings both end it.
 */
export const useHighLatitudePrompt = (
  place: { latitude: number; longitude: number } | null
): { shown: boolean; dismiss: () => void } => {
  const { data: country } = useQuery({
    queryKey: [
      "high-latitude-country",
      place?.latitude.toFixed(COORDINATE_DECIMALS),
      place?.longitude.toFixed(COORDINATE_DECIMALS),
    ],
    queryFn: () => (place ? countryOf(place.latitude, place.longitude) : null),
    enabled: place !== null,
    staleTime: Number.POSITIVE_INFINITY,
  });
  // The countries seen before this screen opened: the prompt stays up on
  // this screen until dismissed, and is gone the next time it opens.
  const seenBefore = useMemo(
    () => readSeenCountries(SecureStore.getItem(SEEN_KEY)),
    []
  );
  const [dismissed, setDismissed] = useState(false);
  const due = needsHighLatitudePrompt(country, seenBefore);

  useEffect(() => {
    if (due) {
      SecureStore.setItem(
        SEEN_KEY,
        withSeenCountry(
          readSeenCountries(SecureStore.getItem(SEEN_KEY)),
          country
        )
      );
    }
  }, [due, country]);

  return { shown: due && !dismissed, dismiss: () => setDismissed(true) };
};
