import { describe, expect, it } from "vitest";

import { mapsUrl } from "./maps-url";

const PLACE = { latitude: 26.4207, longitude: 50.0888, name: "حسينية الرسول" };

describe(mapsUrl, () => {
  it("opens Apple Maps at the point, labelled with the name, on iOS", () => {
    expect(mapsUrl("ios", PLACE)).toBe(
      `https://maps.apple.com/?ll=26.4207,50.0888&q=${encodeURIComponent("حسينية الرسول")}`
    );
  });

  it("opens a labelled geo: pin on Android", () => {
    expect(mapsUrl("android", { ...PLACE, name: "Hall & Centre" })).toBe(
      "geo:26.4207,50.0888?q=26.4207,50.0888(Hall%20%26%20Centre)"
    );
  });
});
