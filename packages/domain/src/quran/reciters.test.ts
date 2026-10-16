import { describe, expect, it } from "vitest";

import {
  DEFAULT_RECITER,
  findReciter,
  groupReciters,
  RECITERS,
  recitationUrl,
} from ".";

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

describe("reciter identity", () => {
  it("gives a person one identity and both names in every style", () => {
    const byPerson = Map.groupBy(RECITERS, (reciter) => reciter.person.id);
    expect(
      byPerson.get("husary")?.map((reciter) => reciter.style)
    ).toStrictEqual(["murattal", "mujawwad", "muallim"]);
    for (const reciters of byPerson.values()) {
      const [first] = reciters;
      for (const reciter of reciters) {
        expect(reciter.person).toBe(first?.person);
        expect(reciter.name).toStrictEqual(first?.person.name);
        expect(reciter.region).toBe(first?.person.region);
      }
    }
  });

  it("names every reciter in Arabic and English", () => {
    for (const reciter of RECITERS) {
      expect(reciter.name.ar.trim()).not.toBe("");
      expect(reciter.name.en.trim()).not.toBe("");
    }
  });

  it("never gives two people the same id or name", () => {
    const people = [
      ...new Map(RECITERS.map((r) => [r.person.id, r.person])).values(),
    ];
    expect(new Set(people.map((p) => p.name.en)).size).toBe(people.length);
    expect(new Set(people.map((p) => p.name.ar)).size).toBe(people.length);
  });
});

describe(groupReciters, () => {
  it("groups by style, then region, in the picker's order", () => {
    const groups = groupReciters();
    expect(groups.map((group) => group.style)).toStrictEqual([
      "murattal",
      "mujawwad",
      "muallim",
    ]);
    const mujawwad = groups.find((group) => group.style === "mujawwad");
    expect(mujawwad?.regions.map((group) => group.region)).toStrictEqual([
      "egypt",
    ]);
  });

  it("places every reciter in exactly one group", () => {
    const keys = groupReciters().flatMap((style) =>
      style.regions.flatMap((region) => region.reciters.map((r) => r.key))
    );
    expect(keys.toSorted()).toStrictEqual(
      RECITERS.map((r) => r.key).toSorted()
    );
  });
});
