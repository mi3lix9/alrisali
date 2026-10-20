import { describe, expect, it } from "vitest";

import type { AdhanCatalogueEntry, StoredFile } from "../shared";
import { installedAdhanSounds, selectableAdhanSound } from "./adhan-catalogue";
import { atTimeSound } from "./adhan-sounds";

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

describe(installedAdhanSounds, () => {
  it("installs only voices that are downloaded", () => {
    const other: AdhanCatalogueEntry = { ...VOICE, id: "other-voice" };
    const installed = installedAdhanSounds([VOICE, other], [FULL, TAKBIR]);
    expect(installed.map(({ id }) => id)).toStrictEqual(["example-voice"]);
  });

  it("gives an At-Time Alert the downloaded recordings", () => {
    const installed = installedAdhanSounds([VOICE], [FULL, TAKBIR]);
    expect(
      atTimeSound({ kind: "adhan", adhanSound: "example-voice" }, installed)
    ).toStrictEqual({
      notification: {
        file: "adhan-example-voice-takbir.wav",
        seconds: 8,
        bytes: 200_000,
      },
      full: {
        file: "adhan-example-voice-full.mp3",
        seconds: 180,
        bytes: 4_000_000,
      },
    });
  });

  it("installs nothing from an empty catalogue", () => {
    expect(installedAdhanSounds([], [FULL, TAKBIR])).toStrictEqual([]);
  });
});

describe(selectableAdhanSound, () => {
  const installed = installedAdhanSounds([VOICE], [FULL, TAKBIR]);

  it("keeps a downloaded voice", () => {
    expect(selectableAdhanSound("example-voice", installed)).toBe(
      "example-voice"
    );
  });

  it("replaces a voice that is not downloaded with the system's sound", () => {
    expect(selectableAdhanSound("example-voice", [])).toBe("system");
  });

  it("keeps the system's sound", () => {
    expect(selectableAdhanSound("system", [])).toBe("system");
  });
});
