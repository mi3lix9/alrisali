import { describe, expect, it } from "vitest";

import {
  currentStep,
  observe,
  salahSteps,
  startSalah,
  stepPlace,
} from "./rakah-machine";
import type { AssistantState, Step } from "./rakah-machine";
import {
  CUSTOM_RAKAH_LIMITS,
  customSalah,
  SALAH_DEFINITIONS,
  SALAH_TYPES,
  withNafila,
} from "./salah-definition";
import type { SalahDefinition } from "./salah-definition";

const NORMAL = { pace: "normal" } as const;

const sequence = (definition: SalahDefinition) =>
  salahSteps(definition).map(
    ({ rakah, position, final }) =>
      `${rakah}:${position}${final ? ":final" : ""}`
  );

/** The Rak'ahs after which the Believer sits for a Tashahhud. */
const tashahhuds = (definition: SalahDefinition) =>
  salahSteps(definition)
    .filter((step) => step.position === "tashahhud")
    .map((step) => step.rakah);

const rakahsOf = (definition: SalahDefinition) =>
  new Set(salahSteps(definition).map((step) => step.rakah)).size;

/** Taps through the whole Salah, recording where the Believer is. */
const tapThrough = (definition: SalahDefinition) => {
  let state: AssistantState = startSalah(definition, NORMAL);
  const places = [stepPlace(state)];
  let at = 0;
  while (!currentStep(state).final) {
    at += 4000;
    state = observe(state, { kind: "advance", at });
    places.push(stepPlace(state));
  }
  return places;
};

const TWO_RAKAH_FINAL: readonly string[] = [
  "1:qiyam",
  "1:ruku",
  "1:itidal",
  "1:sujud",
  "1:jalsa",
  "1:sujud",
  "2:qiyam",
  "2:ruku",
  "2:itidal",
  "2:sujud",
  "2:jalsa",
  "2:sujud",
  "2:tashahhud:final",
];

describe("the five obligatory Salah", () => {
  it.each([
    ["fajr", 2, [2]],
    ["dhuhr", 4, [2, 4]],
    ["asr", 4, [2, 4]],
    ["maghrib", 3, [2, 3]],
    ["isha", 4, [2, 4]],
  ] as const)(
    "prays %s as %i Rak'ahs, sitting after Rak'ahs %j",
    (salah, rakahs, sittings) => {
      const definition = SALAH_DEFINITIONS[salah];
      expect(definition.salah).toBe(salah);
      expect(rakahsOf(definition)).toBe(rakahs);
      expect(tashahhuds(definition)).toStrictEqual(sittings);
    }
  );
});

describe("two-Rak'ah prayers", () => {
  it.each(["ghufayla", "friday", "eid", "ziyarah"] as const)(
    "prays %s as two Rak'ahs with one Tashahhud",
    (type) => {
      expect(sequence(SALAH_DEFINITIONS[type])).toStrictEqual(TWO_RAKAH_FINAL);
    }
  );

  it("logs Friday as no daily Salah", () => {
    expect(SALAH_DEFINITIONS.friday.salah).toBeNull();
  });
});

describe("the Night prayer", () => {
  const { night } = SALAH_DEFINITIONS;

  it("prays eight Rak'ahs in pairs, then Shaf' and a single Witr", () => {
    expect(rakahsOf(night)).toBe(11);
    expect(tashahhuds(night)).toStrictEqual([2, 4, 6, 8, 10, 11]);
    expect(salahSteps(night).filter((step) => step.final)).toStrictEqual([
      { rakah: 11, position: "tashahhud", final: true },
    ]);
  });

  it("rises from each pair's Tashahhud into the next prayer", () => {
    const steps = salahSteps(night);
    const afterFirst = steps.findIndex((step) => step.position === "tashahhud");
    expect(steps[afterFirst + 1]).toStrictEqual({
      rakah: 3,
      position: "qiyam",
      final: false,
    });
  });

  it("names the Shaf' and the Witr as the Believer reaches them", () => {
    const places = tapThrough(night);
    expect(places[0]).toMatchObject({
      segment: 1,
      segments: 6,
      rakah: 1,
      rakahs: 2,
      part: null,
    });
    expect(places.find((place) => place.part === "shaf")).toMatchObject({
      segment: 5,
      rakah: 1,
      rakahs: 2,
    });
    expect(places.at(-1)).toMatchObject({
      segment: 6,
      segments: 6,
      rakah: 1,
      rakahs: 1,
      part: "witr",
    });
  });
});

describe("the Ayat prayer", () => {
  const { ayat } = SALAH_DEFINITIONS;

  it("bows five times in each Rak'ah before the sujud", () => {
    const first = [
      "1:qiyam",
      ...Array.from({ length: 5 }, () => ["1:ruku", "1:itidal"]).flat(),
      "1:sujud",
      "1:jalsa",
      "1:sujud",
    ];
    expect(sequence(ayat)).toStrictEqual([
      ...first,
      ...first.map((step) => step.replace("1:", "2:")),
      "2:tashahhud:final",
    ]);
  });

  it("counts which Ruku the Believer is in", () => {
    const rukus = tapThrough(ayat)
      .filter((place) => place.step.position === "ruku")
      .map((place) => place.ruku);
    expect(rukus.slice(0, 5)).toStrictEqual([
      { number: 1, of: 5 },
      { number: 2, of: 5 },
      { number: 3, of: 5 },
      { number: 4, of: 5 },
      { number: 5, of: 5 },
    ]);
    expect(rukus[5]).toStrictEqual({ number: 1, of: 5 });
  });

  it("does not count Ruku in a Salah with one per Rak'ah", () => {
    const places = tapThrough(SALAH_DEFINITIONS.fajr);
    expect(places.every((place) => place.ruku === null)).toBeTruthy();
  });
});

describe(withNafila, () => {
  it.each([
    ["fajr", ["nafila:2", "fard:2"]],
    ["dhuhr", ["nafila:2", "nafila:2", "nafila:2", "nafila:2", "fard:4"]],
    ["asr", ["nafila:2", "nafila:2", "nafila:2", "nafila:2", "fard:4"]],
    ["maghrib", ["fard:3", "nafila:2", "nafila:2"]],
    ["isha", ["fard:4", "nafila:2"]],
  ] as const)("prays %s with its nafila in order", (salah, expected) => {
    const definition = withNafila(salah);
    expect(
      definition.segments.map(
        (segment) => `${segment.part ?? "fard"}:${segment.rakahs}`
      )
    ).toStrictEqual(expected);
    expect(definition.salah).toBe(salah);
    expect(definition.nafila).toBeTruthy();
  });

  it("sits for the Watirah after Isha", () => {
    expect(withNafila("isha").segments.at(-1)?.seated).toBeTruthy();
    expect(withNafila("isha").segments[0]?.seated).toBeFalsy();
  });

  it("keeps the middle Tashahhud of Dhuhr after its nafila", () => {
    // Four nafila pairs (Rak'ahs 1–8), then Dhuhr's Rak'ahs 9–12.
    expect(tashahhuds(withNafila("dhuhr"))).toStrictEqual([2, 4, 6, 8, 10, 12]);
  });
});

describe(customSalah, () => {
  it("prays an even count in pairs", () => {
    const definition = customSalah(4);
    expect(rakahsOf(definition)).toBe(4);
    expect(tashahhuds(definition)).toStrictEqual([2, 4]);
    expect(definition.salah).toBeNull();
  });

  it("ends an odd count with a single Rak'ah", () => {
    expect(
      customSalah(3).segments.map((segment) => segment.rakahs)
    ).toStrictEqual([2, 1]);
  });

  it("keeps the count within its limits", () => {
    expect(rakahsOf(customSalah(0))).toBe(CUSTOM_RAKAH_LIMITS.min);
    expect(rakahsOf(customSalah(99))).toBe(CUSTOM_RAKAH_LIMITS.max);
  });
});

describe("every Salah type", () => {
  it.each(SALAH_TYPES)("%s ends with exactly one final Tashahhud", (type) => {
    const steps: readonly Step[] = salahSteps(SALAH_DEFINITIONS[type]);
    expect(steps.filter((step) => step.final)).toHaveLength(1);
    expect(steps.at(-1)?.final).toBeTruthy();
    expect(steps[0]?.position).toBe("qiyam");
  });
});
