import { describe, expect, it } from "vitest";

import type { Salah } from "../shared";
import {
  DEFAULT_COVER_THRESHOLDS,
  matDwellMs,
  matProbationMs,
  MAX_USEFUL_DIP,
  readMat,
  recalibrateMat,
  startMatSensor,
  thresholdsFromDip,
} from "./mat";
import type { LumaFrame, MatReading } from "./mat";
import {
  DARK_ROOM,
  dhuhr,
  fajr,
  FLAT_CEILING,
  flickeringSujud,
  FRAME_MS,
  open,
  passBy,
  rakah,
  sujud,
  TEXTURED_CEILING,
  trace,
} from "./mat-fixtures";
import { paceHolds } from "./pace";
import type { PaceChoice } from "./pace";
import { currentStep, observe, startSalah } from "./rakah-machine";
import type { Sighting } from "./rakah-machine";

const NORMAL: PaceChoice = { pace: "normal" };

/**
 * Lays the phone under the frames for one Salah: each frame goes through
 * the Mat sensor, its sightings into the rak'ah machine, and the machine
 * ticks as the screen does.
 */
const pray = (
  salah: Salah,
  frames: readonly LumaFrame[],
  storedDip: number | null = null
) => {
  let state = startSalah(salah, NORMAL);
  let sensor = startMatSensor(storedDip);
  const sightings: Sighting[] = [];
  const readings: MatReading[] = [];
  const step = () => {
    const current = currentStep(state);
    return `${current.rakah} ${current.position}`;
  };
  const visited = [step()];
  let completedAt: number | null = null;
  let lastCoveredAt: number | null = null;

  for (const frame of frames) {
    const read = readMat(sensor, state, frame);
    ({ sensor } = read);
    readings.push(read.reading);
    if (read.reading.covered) {
      lastCoveredAt = frame.at;
    }
    for (const sighting of read.sightings) {
      sightings.push(sighting);
      state = observe(state, { ...sighting, at: frame.at });
    }
    state = observe(state, { kind: "tick", at: frame.at });
    if (step() !== visited.at(-1)) {
      visited.push(step());
    }
    if (state.completed && completedAt === null) {
      completedAt = frame.at;
    }
  }
  return {
    state,
    sensor,
    sightings,
    readings,
    visited,
    completedAt,
    lastCoveredAt,
  };
};

const FAJR_STEPS = [
  "1 qiyam",
  "1 sujud",
  "1 jalsa",
  "1 sujud",
  "2 qiyam",
  "2 sujud",
  "2 jalsa",
  "2 sujud",
  "2 tashahhud",
];

describe(thresholdsFromDip, () => {
  it.each([0.95, MAX_USEFUL_DIP + 0.001, Number.NaN, -0.1])(
    "refuses a dip too shallow to rely on: %d",
    (dip) => {
      expect(thresholdsFromDip(dip)).toBeNull();
    }
  );

  it.each([0, 0.2, 0.45, 0.55, 0.7, MAX_USEFUL_DIP])(
    "keeps cover below shadow below uncover for a dip of %d",
    (dip) => {
      const thresholds = thresholdsFromDip(dip);
      expect(thresholds).not.toBeNull();
      const { coverRatio, shadowRatio, uncoverRatio } = thresholds ?? {
        ...DEFAULT_COVER_THRESHOLDS,
      };
      expect(coverRatio).toBeLessThan(shadowRatio);
      expect(shadowRatio).toBeLessThan(uncoverRatio);
    }
  );

  it.each([0, 0.2, 0.45, 0.7])(
    "only ever loosens the defaults: a dip of %d",
    (dip) => {
      const thresholds = thresholdsFromDip(dip);
      expect(thresholds?.coverRatio).toBeGreaterThanOrEqual(
        DEFAULT_COVER_THRESHOLDS.coverRatio
      );
      expect(thresholds?.shadowRatio).toBeGreaterThanOrEqual(
        DEFAULT_COVER_THRESHOLDS.shadowRatio
      );
      expect(thresholds?.uncoverRatio).toBeGreaterThanOrEqual(
        DEFAULT_COVER_THRESHOLDS.uncoverRatio
      );
    }
  );
});

describe("the Pace's Mat timings", () => {
  it.each([
    ["slow", 2400, 7333],
    ["normal", 1600, 5500],
    ["fast", 1200, 3667],
  ] as const)(
    "%s: a cover counts after %i ms, the middle Tashahhud lasts %i ms",
    (pace, probation, dwell) => {
      const holds = paceHolds({ pace });
      expect(matProbationMs(holds)).toBe(probation);
      expect(matDwellMs(holds)).toBe(dwell);
    }
  );

  it("keeps a Custom Pace's timings between a walking pass and a quick sujud", () => {
    const quick = paceHolds({
      pace: "custom",
      custom: { holdMs: 300, tashahhudMs: 1000 },
    });
    const long = paceHolds({
      pace: "custom",
      custom: { holdMs: 2500, tashahhudMs: 8000 },
    });
    expect(matProbationMs(quick)).toBe(1200);
    expect(matProbationMs(long)).toBe(2400);
    expect(matDwellMs(quick)).toBe(3000);
    expect(matDwellMs(long)).toBe(9000);
  });
});

describe(readMat, () => {
  it("learns the ceiling for 1.6 s before anything counts", () => {
    const { readings, sightings } = pray(
      "fajr",
      trace(TEXTURED_CEILING, open(3000))
    );
    const calibrating = readings.filter((reading) => reading.calibrating);
    expect(calibrating.length * FRAME_MS).toBeGreaterThanOrEqual(1600);
    expect(calibrating.length * FRAME_MS).toBeLessThan(1600 + 2 * FRAME_MS);
    expect(readings.at(-1)?.calibrating).toBeFalsy();
    expect(readings.at(-1)?.tooDark).toBeFalsy();
    expect(sightings).toStrictEqual([]);
  });

  it("warns when the room is too dark to see a sujud", () => {
    const { readings } = pray("fajr", trace(DARK_ROOM, open(3000)));
    expect(readings.at(-1)?.tooDark).toBeTruthy();
  });

  it("ignores hands and passers-by over the phone", () => {
    const { sightings, readings, state } = pray(
      "fajr",
      trace(TEXTURED_CEILING, [
        ...open(3000),
        ...passBy(1000),
        ...open(2000),
        ...passBy(1400),
        ...open(2000),
      ])
    );
    expect(readings.some((reading) => reading.covered)).toBeTruthy();
    expect(sightings).toStrictEqual([]);
    expect(state.index).toBe(0);
  });

  it("counts a sujud once through an auto-exposure flicker", () => {
    const { sightings } = pray(
      "fajr",
      trace(TEXTURED_CEILING, [
        ...open(5000),
        ...flickeringSujud(),
        ...open(1500),
      ])
    );
    expect(sightings).toStrictEqual([
      { kind: "confirmed", position: "sujud" },
      { kind: "confirmed", position: "jalsa" },
    ]);
  });

  it("stays covered while auto-exposure brightens a long sujud", () => {
    const { sightings } = pray(
      "fajr",
      trace(TEXTURED_CEILING, [
        ...open(5000),
        ...sujud({ ms: 9000, dip: 0.4, creep: 0.4 }),
        ...open(1500),
      ])
    );
    expect(sightings).toStrictEqual([
      { kind: "confirmed", position: "sujud" },
      { kind: "confirmed", position: "jalsa" },
    ]);
  });

  it("learns the ceiling again after a recalibration, keeping what it learned", () => {
    const { sensor } = pray("fajr", trace(FLAT_CEILING, fajr({ dip: 0.68 })));
    const again = recalibrateMat(sensor);
    expect(again.reading.calibrating).toBeTruthy();
    expect(again.reading.learnedDip).toBe(sensor.reading.learnedDip);
    expect(again.detector.thresholds).toBe(sensor.detector.thresholds);
  });
});

describe("a modelled Fajr through the rak'ah machine", () => {
  it("follows every sujud under a textured ceiling and completes", () => {
    const { visited, completedAt, lastCoveredAt } = pray(
      "fajr",
      trace(TEXTURED_CEILING, fajr())
    );
    expect(visited).toStrictEqual(FAJR_STEPS);
    expect(completedAt).not.toBeNull();
    // The final Tashahhud counts from when the Believer sat up (Normal: 12 s).
    const held = (completedAt ?? 0) - (lastCoveredAt ?? 0);
    expect(held).toBeGreaterThanOrEqual(12_000);
    expect(held).toBeLessThan(12_000 + FRAME_MS);
  });

  it("catches a shallow sujud on a flat ceiling by its sudden dip, and learns it", () => {
    const { visited, completedAt, readings } = pray(
      "fajr",
      trace(FLAT_CEILING, fajr({ dip: 0.68, creep: 0.1 }))
    );
    expect(visited).toStrictEqual(FAJR_STEPS);
    expect(completedAt).not.toBeNull();
    const learned = readings.at(-1)?.learnedDip ?? 1;
    expect(learned).toBeGreaterThan(0.63);
    expect(learned).toBeLessThan(0.72);
  });

  it("needs this device's kept dip to see a slow, shallow sujud", () => {
    const shallow = trace(
      TEXTURED_CEILING,
      fajr({ dip: 0.74, creep: 0, texture: 0.6, descentMs: 4000, ms: 7000 })
    );
    expect(pray("fajr", shallow).sightings).toStrictEqual([]);

    const { visited, completedAt } = pray("fajr", shallow, 0.7);
    expect(visited).toStrictEqual(FAJR_STEPS);
    expect(completedAt).not.toBeNull();
  });
});

describe("a modelled Dhuhr through the rak'ah machine", () => {
  it("stands for the third Rak'ah after the middle Tashahhud, and completes", () => {
    const { visited, completedAt } = pray(
      "dhuhr",
      trace(TEXTURED_CEILING, dhuhr())
    );
    expect(visited).toStrictEqual([
      ...FAJR_STEPS.slice(0, -1),
      "2 tashahhud",
      "3 qiyam",
      "3 sujud",
      "3 jalsa",
      "3 sujud",
      "4 qiyam",
      "4 sujud",
      "4 jalsa",
      "4 sujud",
      "4 tashahhud",
    ]);
    expect(completedAt).not.toBeNull();
  });

  it("lets a sujud before the middle Tashahhud ends start the third Rak'ah", () => {
    const { visited } = pray(
      "dhuhr",
      trace(TEXTURED_CEILING, [
        ...open(9000),
        ...rakah(),
        ...open(8000),
        ...rakah(),
        ...open(4500),
        ...sujud(),
        ...open(9000),
      ])
    );
    expect(visited.slice(-4)).toStrictEqual([
      "2 sujud",
      "2 tashahhud",
      "3 sujud",
      "3 jalsa",
    ]);
  });

  it("ignores a passer-by during the middle Tashahhud", () => {
    const { visited } = pray(
      "dhuhr",
      trace(TEXTURED_CEILING, [
        ...open(9000),
        ...rakah(),
        ...open(8000),
        ...rakah(),
        ...open(4000),
        ...passBy(1000),
        ...open(4500),
      ])
    );
    expect(visited.slice(-2)).toStrictEqual(["2 tashahhud", "3 qiyam"]);
  });
});
