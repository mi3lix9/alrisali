import { requireOptionalNativeModule } from "expo";

// The proximity sensor (modules/proximity). Android reports a distance and
// the sensor's range; iOS only near or far.

export interface ProximityEvent {
  near: boolean;
  distance?: number;
  maxRange?: number;
}

interface ProximityModule {
  addListener: (
    eventName: "onProximity",
    listener: (event: ProximityEvent) => void
  ) => { remove: () => void };
  isAvailable: () => boolean;
  start: () => void;
  stop: () => void;
}

/** Null in builds without the native module (Expo Go, simulators without it). */
export const proximityModule =
  requireOptionalNativeModule<ProximityModule>("Proximity");

let available: boolean | null = null;

/** Whether this device has a proximity sensor; Proximity mode is offered only then. */
export const hasProximitySensor = (): boolean => {
  if (available === null) {
    try {
      available = proximityModule?.isAvailable() ?? false;
    } catch {
      available = false;
    }
  }
  return available;
};
