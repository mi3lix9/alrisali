import { describe, expect, it } from "vitest";

import {
  needsHighLatitudePrompt,
  readSeenCountries,
  withSeenCountry,
} from "./high-latitude-prompt";

describe("the one-time high-latitude prompt", () => {
  it("prompts for a country not seen before", () => {
    expect(needsHighLatitudePrompt("GB", [])).toBeTruthy();
    expect(needsHighLatitudePrompt("GB", ["IS"])).toBeTruthy();
  });

  it("does not prompt again for a country already seen", () => {
    const seen = readSeenCountries(withSeenCountry([], "GB"));

    expect(needsHighLatitudePrompt("GB", seen)).toBeFalsy();
    expect(needsHighLatitudePrompt("IS", seen)).toBeTruthy();
  });

  it("keeps each country once", () => {
    expect(
      readSeenCountries(withSeenCountry(["GB", "IS"], "GB"))
    ).toStrictEqual(["GB", "IS"]);
  });

  it("does not prompt without a known country", () => {
    expect(needsHighLatitudePrompt(null, [])).toBeFalsy();
    expect(needsHighLatitudePrompt(undefined, [])).toBeFalsy();
    expect(needsHighLatitudePrompt("", [])).toBeFalsy();
  });

  it("reads nothing stored, or something unreadable, as no countries seen", () => {
    expect(readSeenCountries(null)).toStrictEqual([]);
    expect(readSeenCountries("not json")).toStrictEqual([]);
    expect(readSeenCountries('{"GB":true}')).toStrictEqual([]);
  });
});
