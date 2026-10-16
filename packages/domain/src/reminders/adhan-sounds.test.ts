import { describe, expect, it } from "vitest";

import {
  adhanSoundSchema,
  atTimeSound,
  isFullAdhanAvailable,
} from "./adhan-sounds";
import type { AdhanSound } from "./adhan-sounds";

// A catalogue entry as an Admin would publish one (ticket 31). No licensed
// recording exists yet, so the files here are placeholders, not content.
const VOICE: AdhanSound = {
  id: "example-voice",
  name: { ar: "صوت تجريبي", en: "Example voice" },
  full: { file: "adhan-example-voice.wav", seconds: 180, bytes: 4_000_000 },
  takbir: {
    file: "takbir-example-voice.wav",
    seconds: 8,
    bytes: 200_000,
  },
  sourceId: "example-source",
};

describe(atTimeSound, () => {
  it("plays the chosen voice's takbir cut for the short takbir", () => {
    expect(
      atTimeSound({ kind: "takbir", adhanSound: "example-voice" }, [VOICE])
    ).toStrictEqual({ notification: VOICE.takbir, full: null });
  });

  it("sounds the takbir and keeps the full adhan for the full adhan", () => {
    expect(
      atTimeSound({ kind: "adhan", adhanSound: "example-voice" }, [VOICE])
    ).toStrictEqual({ notification: VOICE.takbir, full: VOICE.full });
  });

  it("falls back to the system sound while no recording is installed", () => {
    for (const kind of ["takbir", "adhan"] as const) {
      expect(
        atTimeSound({ kind, adhanSound: "example-voice" }, [])
      ).toStrictEqual({ notification: null, full: null });
    }
    expect(
      atTimeSound({ kind: "takbir", adhanSound: "system" }, [VOICE])
    ).toStrictEqual({ notification: null, full: null });
  });

  it("plays no recording for a silent alert", () => {
    expect(atTimeSound({ kind: "silent" }, [VOICE])).toStrictEqual({
      notification: null,
      full: null,
    });
  });
});

describe(isFullAdhanAvailable, () => {
  it("offers the full adhan only once a recording is installed", () => {
    expect(isFullAdhanAvailable([])).toBeFalsy();
    expect(isFullAdhanAvailable([VOICE])).toBeTruthy();
  });
});

describe("an adhan catalogue entry", () => {
  it("accepts a catalogue entry with a full adhan and its takbir cut", () => {
    expect(adhanSoundSchema.parse(VOICE)).toStrictEqual(VOICE);
  });

  it("refuses a takbir cut longer than iOS plays (30 seconds)", () => {
    expect(
      adhanSoundSchema.safeParse({
        ...VOICE,
        takbir: { ...VOICE.takbir, seconds: 31 },
      }).success
    ).toBeFalsy();
  });

  it("refuses an entry without its takbir cut", () => {
    const { takbir: _takbir, ...withoutTakbir } = VOICE;
    expect(adhanSoundSchema.safeParse(withoutTakbir).success).toBeFalsy();
  });
});
