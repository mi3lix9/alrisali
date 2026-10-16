import type {
  RecitationEvent,
  RecitationPlayback,
} from "@alrisali/domain/quran";

// The two clocks recitation runs on: the silence after an ayah and the sleep
// timer. The domain decides when each starts and what it means; this only
// waits and reports back. Call `follow` with every new playback state.

export interface RecitationTimers {
  follow: (playback: RecitationPlayback) => void;
}

export const createRecitationTimers = (
  send: (event: RecitationEvent) => void,
  now: () => number = Date.now
): RecitationTimers => {
  let pause: { key: string; timer: ReturnType<typeof setTimeout> } | null =
    null;
  let sleep: { at: number; timer: ReturnType<typeof setTimeout> } | null = null;

  const clearPause = () => {
    if (pause) {
      clearTimeout(pause.timer);
      pause = null;
    }
  };
  const clearSleep = () => {
    if (sleep) {
      clearTimeout(sleep.timer);
      sleep = null;
    }
  };

  return {
    follow: (playback) => {
      if (playback.status === "pausing") {
        const key = `${playback.ayah}/${playback.ayahPass}/${playback.rangePass}`;
        if (pause?.key !== key) {
          clearPause();
          pause = {
            key,
            timer: setTimeout(
              () => {
                pause = null;
                send({ type: "pauseElapsed" });
              },
              (playback.pauseSeconds ?? 0) * 1000
            ),
          };
        }
      } else {
        clearPause();
      }

      const deadline = playback.status === "idle" ? null : playback.sleepAt;
      if (deadline === null) {
        clearSleep();
      } else if (sleep?.at !== deadline) {
        clearSleep();
        sleep = {
          at: deadline,
          timer: setTimeout(
            () => {
              sleep = null;
              send({ type: "tick", now: now() });
            },
            Math.max(0, deadline - now())
          ),
        };
      }
    },
  };
};
