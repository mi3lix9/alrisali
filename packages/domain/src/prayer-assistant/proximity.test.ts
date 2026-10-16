import { describe, expect, it } from "vitest";

import {
  defaultThresholds,
  PROXIMITY_MIN_MS,
  readProximity,
  startProximitySensor,
  thresholdsFromDistance,
} from "./proximity";
import type { ProximitySample } from "./proximity";
import { currentStep, observe, startSalah } from "./rakah-machine";
import type { Sighting } from "./rakah-machine";
import { SALAH_DEFINITIONS } from "./salah-definition";

const TICK_MS = 50;
const RANGE = 5;
/** A forehead over the sensor, and the open phone. */
const NEAR = 0;
const FAR = RANGE;

/** A run of `ms` of one distance, as a sensor ticked every 50 ms would report it. */
type Run = readonly [distance: number, ms: number];

const near = (ms = 3000): Run => [NEAR, ms];
const far = (ms: number): Run => [FAR, ms];

const rakah = (): Run[] => [far(1500), near(), far(1500), near()];

const samples = (runs: readonly Run[], from = 0): ProximitySample[] => {
  const out: ProximitySample[] = [];
  let at = from;
  for (const [distance, ms] of runs) {
    for (let elapsed = 0; elapsed < ms; elapsed += TICK_MS) {
      at += TICK_MS;
      out.push({
        at,
        near: distance < RANGE,
        distance,
        maxRange: RANGE,
      });
    }
  }
  return out;
};

const pray = (
  salah: "fajr" | "dhuhr",
  frames: readonly ProximitySample[],
  stored: { distance: number; maxRange: number } | null = null
) => {
  let state = startSalah(SALAH_DEFINITIONS[salah], { pace: "normal" });
  let sensor = startProximitySensor(stored);
  const sightings: Sighting[] = [];
  const visited = [""];
  for (const frame of frames) {
    const read = readProximity(sensor, state, frame);
    ({ sensor } = read);
    for (const sighting of read.sightings) {
      sightings.push(sighting);
      state = observe(state, { ...sighting, at: frame.at });
    }
    state = observe(state, { kind: "tick", at: frame.at });
    const step = currentStep(state);
    const label = `${step.rakah} ${step.position}`;
    if (label !== visited.at(-1)) {
      visited.push(label);
    }
  }
  return { state, sensor, sightings, visited: visited.slice(1) };
};

const FAJR = [far(3000), ...rakah(), far(8000), ...rakah(), far(15_000)];

describe(thresholdsFromDistance, () => {
  it.each([Number.NaN, -1, RANGE, RANGE * 0.95])(
    "refuses an unusable distance: %d",
    (distance) => {
      expect(thresholdsFromDistance(distance, RANGE)).toBeNull();
    }
  );

  it("refuses an unusable range", () => {
    expect(thresholdsFromDistance(0, 0)).toBeNull();
    expect(thresholdsFromDistance(0, Number.NaN)).toBeNull();
  });

  it.each([0, 1, 2, 3.5])(
    "keeps near below far, and only loosens the default: %d cm",
    (distance) => {
      const learned = thresholdsFromDistance(distance, RANGE);
      const fallback = defaultThresholds(RANGE);
      expect(learned).not.toBeNull();
      expect(learned?.nearBelow).toBeLessThan(learned?.farAbove ?? 0);
      expect(learned?.farAbove).toBeLessThan(RANGE);
      expect(learned?.nearBelow).toBeGreaterThanOrEqual(fallback.nearBelow);
    }
  );

  it("takes a shallower sujud as near once learned", () => {
    const learned = thresholdsFromDistance(3, RANGE);
    expect(learned?.nearBelow).toBeGreaterThan(3.5);
  });
});

describe(readProximity, () => {
  it("counts nothing before the debounce has passed", () => {
    const frames = samples([far(500), near(PROXIMITY_MIN_MS - TICK_MS)]);
    expect(pray("fajr", frames).sightings).toStrictEqual([]);
  });

  it("ignores a hand passing over the phone", () => {
    const frames = samples([
      far(2000),
      near(200),
      far(500),
      near(250),
      far(500),
    ]);
    expect(pray("fajr", frames).sightings).toStrictEqual([]);
  });

  it("counts a sujud once the near has lasted 300 ms", () => {
    const frames = samples([far(1000), near(PROXIMITY_MIN_MS + TICK_MS)]);
    expect(pray("fajr", frames).sightings).toStrictEqual([
      { kind: "confirmed", position: "sujud" },
    ]);
  });

  it("follows a whole Fajr from sujud alone", () => {
    const { state, visited } = pray("fajr", samples(FAJR));
    expect(visited).toStrictEqual([
      "1 qiyam",
      "1 sujud",
      "1 jalsa",
      "1 sujud",
      "2 qiyam",
      "2 sujud",
      "2 jalsa",
      "2 sujud",
      "2 tashahhud",
    ]);
    expect(state.completed).toBeTruthy();
  });

  it("follows a four-rak'ah Dhuhr with its middle Tashahhud", () => {
    const frames = samples([
      far(3000),
      ...rakah(),
      far(8000),
      ...rakah(),
      far(9500),
      far(6000),
      ...rakah(),
      far(8000),
      ...rakah(),
      far(15_000),
    ]);
    const { state, visited } = pray("dhuhr", frames);
    expect(visited.filter((step) => step.endsWith("tashahhud"))).toStrictEqual([
      "2 tashahhud",
      "4 tashahhud",
    ]);
    expect(visited.at(-1)).toBe("4 tashahhud");
    expect(state.completed).toBeTruthy();
  });

  it("is deaf to a sample that arrives out of order", () => {
    const frames = samples([far(1000), near(1000)]);
    const first = pray("fajr", frames);
    const read = readProximity(first.sensor, first.state, {
      at: 1,
      near: false,
      distance: FAR,
      maxRange: RANGE,
    });
    expect(read.sensor).toBe(first.sensor);
    expect(read.sightings).toStrictEqual([]);
  });

  it("uses the boolean alone where no distance is given", () => {
    const frames = samples([far(1000), near(1000)]).map((sample) => ({
      ...sample,
      distance: null,
      maxRange: null,
    }));
    expect(pray("fajr", frames).sightings).toHaveLength(1);
  });

  it("learns the first sujud's distance after rising", () => {
    const { sensor } = pray("fajr", samples([far(1000), [1, 3000], far(1000)]));
    expect(sensor.reading.learnedDistance).toBe(1);
    expect(sensor.thresholds).not.toBeNull();
  });

  it("starts from the thresholds this device kept", () => {
    const sensor = startProximitySensor({ distance: 1, maxRange: RANGE });
    expect(sensor.thresholds).toStrictEqual(thresholdsFromDistance(1, RANGE));
  });

  it("holds near while the head hovers between the thresholds", () => {
    const hover = 2.9;
    const { sightings } = pray(
      "fajr",
      samples([far(1000), near(1000), [hover, 1000], near(1000)])
    );
    expect(sightings).toStrictEqual([{ kind: "confirmed", position: "sujud" }]);
  });
});
