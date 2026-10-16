/** A place to open in the device's maps app. */
export interface MapsPlace {
  latitude: number;
  longitude: number;
  name: string;
}

/**
 * Opens `place` in the platform's maps app: Apple Maps' universal link on
 * iOS, a `geo:` URI (any installed maps app, labelled pin) elsewhere.
 */
export const mapsUrl = (
  platform: string,
  { latitude, longitude, name }: MapsPlace
): string => {
  const point = `${latitude},${longitude}`;
  const label = encodeURIComponent(name);
  return platform === "ios"
    ? `https://maps.apple.com/?ll=${point}&q=${label}`
    : `geo:${point}?q=${point}(${label})`;
};
