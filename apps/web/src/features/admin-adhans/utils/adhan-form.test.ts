import type { AdhanCatalogueEntry } from "@alrisali/domain/shared";
import { describe, expect, it } from "vitest";

import {
  adhanToFields,
  durationProblem,
  emptyAdhanFields,
  formatSeconds,
  validateAdhanFields,
} from "./adhan-form";
import type { AdhanFields } from "./adhan-form";

const voice: AdhanCatalogueEntry = {
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

describe("saving a voice's form", () => {
  it("keeps an edited voice's id and unchanged recordings", () => {
    const result = validateAdhanFields(adhanToFields(voice));
    expect(result).toStrictEqual({ ok: true, draft: voice });
  });

  it("saves a new voice without an id, trimming its text", () => {
    const fields: AdhanFields = {
      ...adhanToFields(voice),
      id: null,
      name: { ar: "  صوت ", en: " Example voice " },
      credit: " Example reciter ",
    };
    const result = validateAdhanFields(fields);
    expect(result.ok && "id" in result.draft).toBeFalsy();
    expect(result.ok && result.draft.credit).toBe("Example reciter");
    expect(result.ok && result.draft.name).toStrictEqual({
      ar: "صوت",
      en: "Example voice",
    });
  });

  it("asks for names, credit and both recordings", () => {
    const result = validateAdhanFields(emptyAdhanFields());
    expect(result.ok).toBeFalsy();
    expect(!result.ok && Object.keys(result.errors).toSorted()).toStrictEqual([
      "credit",
      "full.key",
      "name.ar",
      "name.en",
      "takbir.key",
    ]);
  });

  it("refuses a takbir over 30 seconds and a recording of unknown size", () => {
    const result = validateAdhanFields({
      ...adhanToFields(voice),
      full: { ...voice.full, bytes: 0 },
      takbir: { ...voice.takbir, seconds: 31 },
    });
    expect(!result.ok && result.errors["full.key"]).toContain("size");
    expect(!result.ok && result.errors["takbir.key"]).toContain("30");
  });
});

describe(durationProblem, () => {
  it("limits only the takbir, and needs a readable duration", () => {
    expect(durationProblem("takbir", 30)).toBeNull();
    expect(durationProblem("takbir", 30.5)).not.toBeNull();
    expect(durationProblem("full", 600)).toBeNull();
    expect(durationProblem("full", Number.NaN)).not.toBeNull();
    expect(durationProblem("full", 0)).not.toBeNull();
  });
});

describe(formatSeconds, () => {
  it("shows minutes from a minute up", () => {
    expect(formatSeconds(8)).toBe("8 s");
    expect(formatSeconds(185)).toBe("3:05");
  });
});
