import {
  readProximity,
  startProximitySensor,
} from "@alrisali/domain/prayer-assistant";
import type {
  AssistantState,
  ProximityReading,
  ProximitySample,
  ProximitySensor,
  Sighting,
} from "@alrisali/domain/prayer-assistant";
import { useEffect, useMemo, useState } from "react";

import {
  keepProximityDistance,
  readProximityDistance,
} from "../data/proximity-distance";
import { proximityModule } from "../data/proximity-module";
import type { ProximityEvent } from "../data/proximity-module";

/**
 * The sensor reports only changes, but the debounce and the Tashahhud need
 * time to pass: the latest reading goes through again on this beat.
 */
const BEAT_MS = 100;

interface ProximityLoop {
  /** The machine moved: the next readings read against this state. */
  follow: (state: AssistantState) => void;
  hear: (event: ProximityEvent) => void;
  beat: () => void;
}

/**
 * The Proximity sensor between readings. Events arrive between renders, so
 * it lives outside React state: every reading's sightings reach the machine,
 * and the screen redraws only when the near state changes.
 */
const createProximityLoop = (
  send: (sighting: Sighting) => void,
  show: (reading: ProximityReading) => void
): ProximityLoop => {
  let machine: AssistantState | null = null;
  let sensor: ProximitySensor | null = null;
  let latest: Omit<ProximitySample, "at"> = {
    near: false,
    distance: null,
    maxRange: null,
  };
  let shown: boolean | null = null;

  const read = () => {
    if (!machine) {
      return;
    }
    const before = sensor ?? startProximitySensor(readProximityDistance());
    const result = readProximity(before, machine, {
      ...latest,
      at: performance.now(),
    });
    ({ sensor } = result);
    for (const sighting of result.sightings) {
      send(sighting);
    }
    const { learnedDistance } = result.reading;
    if (
      learnedDistance !== null &&
      before.reading.learnedDistance === null &&
      result.sensor.maxRange !== null
    ) {
      keepProximityDistance({
        distance: learnedDistance,
        maxRange: result.sensor.maxRange,
      });
    }
    if (shown !== result.reading.near) {
      shown = result.reading.near;
      show(result.reading);
    }
  };

  return {
    follow: (state) => {
      machine = state;
    },
    hear: ({ near, distance, maxRange }) => {
      latest = { near, distance: distance ?? null, maxRange: maxRange ?? null };
      read();
    },
    beat: read,
  };
};

/**
 * Listens to the proximity sensor while `active` and sends each sujud it
 * proves to the rak'ah machine as `confirmed`. The first sujud of a Salah
 * tunes the thresholds; the device keeps that distance for the next Salah.
 * Returns whether the forehead is over the sensor.
 */
export const useProximitySensor = (
  state: AssistantState,
  send: (sighting: Sighting) => void,
  active: boolean
): boolean => {
  const [reading, setReading] = useState<ProximityReading | null>(null);
  // `send` and `setReading` are stable: one loop for the screen's life.
  const loop = useMemo(() => createProximityLoop(send, setReading), [send]);

  useEffect(() => {
    loop.follow(state);
  }, [loop, state]);

  useEffect(() => {
    if (!active || !proximityModule) {
      return;
    }
    const subscription = proximityModule.addListener("onProximity", loop.hear);
    proximityModule.start();
    const timer = setInterval(loop.beat, BEAT_MS);
    return () => {
      clearInterval(timer);
      subscription.remove();
      proximityModule?.stop();
    };
  }, [loop, active]);

  return reading?.near ?? false;
};
