import { describe, expect, it } from "vitest";

import {
  adhanCatalogueEntrySchema,
  adhanFileName,
  adhanFilesToDownload,
  adhanIdOfFile,
  isAdhanDownloaded,
} from "./adhan-catalogue";
import type { AdhanCatalogueEntry } from "./adhan-catalogue";
import type { StoredFile } from "./downloads";

// A voice as an Admin would publish it (no licensed recording is published
// by this app: this one is made up for the tests).
const VOICE: AdhanCatalogueEntry = {
  id: "example-voice",
  name: { ar: "صوت تجريبي", en: "Example voice" },
  credit: "Example reciter, example licence",
  full: {
    key: "adhan-full/6f1c0f4e-3f3a-4a55-9d4b-0a1f6a6f0001.mp3",
    seconds: 180,
    bytes: 4_000_000,
  },
  takbir: {
    key: "adhan-takbir/6f1c0f4e-3f3a-4a55-9d4b-0a1f6a6f0002.wav",
    seconds: 8,
    bytes: 200_000,
  },
};

const stored = (name: string, bytes: number): StoredFile => ({
  kind: "adhan",
  group: VOICE.id,
  name,
  bytes,
});

const FULL = stored("adhan-example-voice-full.mp3", 4_000_000);
const TAKBIR = stored("adhan-example-voice-takbir.wav", 200_000);

describe("an adhan catalogue entry", () => {
  it("accepts a voice with both recordings", () => {
    expect(adhanCatalogueEntrySchema.parse(VOICE)).toStrictEqual(VOICE);
  });

  it("refuses a takbir longer than iOS plays", () => {
    expect(
      adhanCatalogueEntrySchema.safeParse({
        ...VOICE,
        takbir: { ...VOICE.takbir, seconds: 31 },
      }).success
    ).toBeFalsy();
  });

  it("refuses a recording uploaded as the other cut", () => {
    expect(
      adhanCatalogueEntrySchema.safeParse({
        ...VOICE,
        full: { ...VOICE.full, key: VOICE.takbir.key },
      }).success
    ).toBeFalsy();
  });

  it("refuses the id the system's sound uses", () => {
    expect(
      adhanCatalogueEntrySchema.safeParse({ ...VOICE, id: "system" }).success
    ).toBeFalsy();
  });
});

describe(adhanFileName, () => {
  it("names a recording after its voice and cut, keeping the extension", () => {
    expect(adhanFileName(VOICE, "full")).toBe("adhan-example-voice-full.mp3");
    expect(adhanFileName(VOICE, "takbir")).toBe(
      "adhan-example-voice-takbir.wav"
    );
  });

  it("is read back to the voice it belongs to", () => {
    expect(adhanIdOfFile("adhan-example-voice-full.mp3")).toBe("example-voice");
    expect(adhanIdOfFile("adhan-takbir-takbir.wav")).toBe("takbir");
    expect(adhanIdOfFile("chime.wav")).toBeNull();
  });
});

describe(isAdhanDownloaded, () => {
  it("is downloaded once both recordings are stored whole", () => {
    expect(isAdhanDownloaded(VOICE, [FULL, TAKBIR])).toBeTruthy();
  });

  it("is not downloaded with a recording missing", () => {
    expect(isAdhanDownloaded(VOICE, [FULL])).toBeFalsy();
    expect(isAdhanDownloaded(VOICE, [])).toBeFalsy();
  });

  it("is not downloaded when the Admin replaced a recording (another size)", () => {
    expect(
      isAdhanDownloaded(VOICE, [FULL, stored(TAKBIR.name, 190_000)])
    ).toBeFalsy();
  });

  it("ignores another kind of download with the same name", () => {
    expect(
      isAdhanDownloaded(VOICE, [FULL, { ...TAKBIR, kind: "recitation" }])
    ).toBeFalsy();
  });
});

describe(adhanFilesToDownload, () => {
  it("lists both recordings of a voice not on the device", () => {
    expect(adhanFilesToDownload(VOICE, []).map(({ key }) => key)).toStrictEqual(
      [VOICE.full.key, VOICE.takbir.key]
    );
  });

  it("lists only what is still missing", () => {
    expect(
      adhanFilesToDownload(VOICE, [FULL]).map(({ name }) => name)
    ).toStrictEqual([TAKBIR.name]);
  });
});
