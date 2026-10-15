import {
  initialProgress,
  isAdvancing,
  PACE_MS,
  reciteStep,
} from "@alrisali/domain/recite-along";
import type { RecitePace, ReciteMode } from "@alrisali/domain/recite-along";
import { useEffect, useReducer } from "react";

/** Recite-Along progress over `total` words, ticking at the chosen pace. */
export const useReciteProgress = (
  mode: ReciteMode,
  pace: RecitePace,
  total: number
) => {
  const [progress, dispatch] = useReducer(reciteStep, undefined, () =>
    initialProgress(mode, total)
  );
  const advancing = isAdvancing(progress);

  useEffect(() => {
    if (progress.mode !== mode) {
      dispatch({ type: "setMode", mode });
    }
  }, [mode, progress.mode]);

  useEffect(() => {
    if (!advancing) {
      return;
    }
    const timer = setInterval(() => dispatch({ type: "tick" }), PACE_MS[pace]);
    return () => clearInterval(timer);
  }, [advancing, pace]);

  return [progress, dispatch] as const;
};
