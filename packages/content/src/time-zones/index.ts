import tzLookup from "@photostructure/tz-lookup";

/**
 * The IANA time zone in force at a place, from the bundled time-zone
 * boundaries (`@photostructure/tz-lookup`, built from timezone-boundary-builder;
 * see `notices/timezone-boundaries.md`). Pure data: no network, no file system,
 * so it runs on Hermes. Out at sea it gives the nautical `Etc/GMT±N` zone.
 */
export const timeZoneAt = (latitude: number, longitude: number): string =>
  tzLookup(latitude, longitude);
