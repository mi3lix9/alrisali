export interface Coordinates {
  latitude: number;
  longitude: number;
}

const PAIR =
  /^\s*(?<latitude>[+-]?\d+(?:\.\d+)?)\s*(?:,|\s)\s*(?<longitude>[+-]?\d+(?:\.\d+)?)\s*$/u;
/** A Google Maps place pin: `!3d<lat>!4d<lng>`, more exact than the view. */
const GOOGLE_PIN =
  /!3d(?<latitude>[+-]?\d+(?:\.\d+)?)!4d(?<longitude>[+-]?\d+(?:\.\d+)?)/u;
/** A Google Maps view centre: `/@<lat>,<lng>,<zoom>z`. */
const GOOGLE_VIEW =
  /@(?<latitude>[+-]?\d+(?:\.\d+)?),(?<longitude>[+-]?\d+(?:\.\d+)?)/u;
/** Query parameters Google and Apple Maps put a point in, most exact first. */
const POINT_PARAMETERS = [
  "coordinate",
  "q",
  "query",
  "ll",
  "daddr",
  "destination",
  "center",
  "sll",
] as const;

/** The point a match's `latitude` and `longitude` groups name, if valid. */
const toCoordinates = (match: RegExpExecArray | null): Coordinates | null => {
  const latitudeText = match?.groups?.latitude;
  const longitudeText = match?.groups?.longitude;
  if (latitudeText === undefined || longitudeText === undefined) {
    return null;
  }
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  const inRange =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  return inRange ? { latitude, longitude } : null;
};

const fromPair = (text: string): Coordinates | null =>
  toCoordinates(PAIR.exec(text));

const fromUrl = (text: string): Coordinates | null => {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const pin = toCoordinates(GOOGLE_PIN.exec(url.pathname + url.search));
  if (pin) {
    return pin;
  }
  for (const name of POINT_PARAMETERS) {
    const value = url.searchParams.get(name);
    const point = value === null ? null : fromPair(value);
    if (point) {
      return point;
    }
  }
  return toCoordinates(GOOGLE_VIEW.exec(url.pathname));
};

/**
 * Reads a venue's coordinates from what an Admin pastes: a "lat, lng" pair
 * or a Google or Apple Maps link that carries them. Null when it holds none
 * (a shortened link such as maps.app.goo.gl has to be opened first).
 */
export const parseCoordinates = (text: string): Coordinates | null => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  return fromPair(trimmed) ?? fromUrl(trimmed);
};
