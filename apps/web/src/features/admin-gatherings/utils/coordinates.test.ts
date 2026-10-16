import { describe, expect, it } from "vitest";

import { parseCoordinates } from "./coordinates";

const RIYADH = { latitude: 24.7136, longitude: 46.6753 };

describe(parseCoordinates, () => {
  it.each([
    "24.7136, 46.6753",
    "24.7136,46.6753",
    "  24.7136 46.6753 ",
    "+24.7136, +46.6753",
  ])("reads the pair %j", (text) => {
    expect(parseCoordinates(text)).toStrictEqual(RIYADH);
  });

  it("reads negative coordinates", () => {
    expect(parseCoordinates("-33.8688, 151.2093")).toStrictEqual({
      latitude: -33.8688,
      longitude: 151.2093,
    });
  });

  it.each([
    [
      "Google place link (pin wins over the view)",
      "https://www.google.com/maps/place/Mosque/@24.70,46.60,15z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d24.7136!4d46.6753",
    ],
    ["Google view link", "https://www.google.com/maps/@24.7136,46.6753,17z"],
    [
      "Google search link",
      "https://www.google.com/maps/search/?api=1&query=24.7136%2C46.6753",
    ],
    ["Google q link", "https://maps.google.com/?q=24.7136,46.6753"],
    ["Apple ll link", "https://maps.apple.com/?ll=24.7136,46.6753&q=Mosque"],
    [
      "Apple coordinate link",
      "https://maps.apple.com/place?coordinate=24.7136,46.6753&name=Mosque",
    ],
  ])("reads a %s", (_, url) => {
    expect(parseCoordinates(url)).toStrictEqual(RIYADH);
  });

  it("prefers the place in an Apple link over the map centre", () => {
    expect(
      parseCoordinates(
        "https://maps.apple.com/?q=Mosque&ll=24.7136,46.6753&sll=20,40"
      )
    ).toStrictEqual(RIYADH);
  });

  it.each([
    "",
    "Riyadh",
    "91, 46",
    "24, 181",
    "24.7136",
    "https://maps.app.goo.gl/AbCdEf",
    "https://maps.apple.com/?q=Mosque",
  ])("finds nothing in %j", (text) => {
    expect(parseCoordinates(text)).toBeNull();
  });
});
