import { describe, expect, it } from "vitest";

import { DEFAULT_RECITER, findReciter, RECITERS, recitationUrl } from ".";

describe(recitationUrl, () => {
  it("numbers alquran.cloud files by the ayah's place in the whole Quran", () => {
    expect(recitationUrl("ar.alafasy", "1:1")).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3"
    );
    expect(recitationUrl("ar.alafasy", "2:1")).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/8.mp3"
    );
    expect(recitationUrl("ar.alafasy", "114:6")).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6236.mp3"
    );
  });

  it("asks alquran.cloud for the bitrate the reciter is published in", () => {
    expect(recitationUrl("ar.abdulsamad", "2:255")).toBe(
      "https://cdn.islamic.network/quran/audio/64/ar.abdulsamad/262.mp3"
    );
  });

  it("names EveryAyah files by surah and ayah, each padded to three digits", () => {
    expect(recitationUrl("everyayah.minshawy-murattal", "2:255")).toBe(
      "https://everyayah.com/data/Minshawy_Murattal_128kbps/002255.mp3"
    );
    expect(recitationUrl("everyayah.minshawy-murattal", "114:6")).toBe(
      "https://everyayah.com/data/Minshawy_Murattal_128kbps/114006.mp3"
    );
  });

  it("refuses an ayah the Quran does not have", () => {
    expect(() => recitationUrl("ar.alafasy", "1:8")).toThrow(RangeError);
  });
});

describe(findReciter, () => {
  it("recites with Alafasy by default", () => {
    expect(DEFAULT_RECITER).toBe("ar.alafasy");
    expect(findReciter(DEFAULT_RECITER)?.name.en).toBe(
      "Mishary Rashid Alafasy"
    );
  });

  it("finds no reciter for a key the app does not bundle", () => {
    expect(findReciter("7")).toBeUndefined();
  });

  it("gives every bundled reciter its own key", () => {
    const keys = RECITERS.map((reciter) => reciter.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
