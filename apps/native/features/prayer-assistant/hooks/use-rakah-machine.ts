import {
  completesAt,
  observe,
  startSalah,
} from "@alrisali/domain/prayer-assistant";
import type {
  AssistantState,
  PaceChoice,
  SalahDefinition,
  Sighting,
} from "@alrisali/domain/prayer-assistant";
import { useCallback, useEffect, useReducer } from "react";

export interface RakahMachine {
  state: AssistantState;
  /**
   * Feeds the machine. Tap mode sends `advance` and `back`; a Recognition
   * Mode's sensor sends `sensed` or `confirmed` Positions through the same
   * call, so every mode shares one clock and one machine.
   */
  send: (sighting: Sighting) => void;
}

/**
 * The rak'ah machine for one prayer, on the monotonic clock. It ticks itself
 * when the final Tashahhud hold is due, so tap mode ends without a sensor.
 */
export const useRakahMachine = (
  definition: SalahDefinition,
  pace: PaceChoice
): RakahMachine => {
  const [state, dispatch] = useReducer(observe, undefined, () =>
    startSalah(definition, pace)
  );

  const send = useCallback(
    (sighting: Sighting) => dispatch({ ...sighting, at: performance.now() }),
    []
  );

  const due = completesAt(state);
  useEffect(() => {
    if (due === null) {
      return;
    }
    const timer = setTimeout(
      () => dispatch({ kind: "tick", at: performance.now() }),
      Math.max(0, due - performance.now())
    );
    return () => clearTimeout(timer);
  }, [due]);

  return { state, send };
};
