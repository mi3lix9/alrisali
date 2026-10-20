import {
  playDuaEvent,
  startDuaQueue,
  stepDuaQueue,
} from "@alrisali/domain/quran";
import type { DuaQueue, DuaRange } from "@alrisali/domain/quran";
import { create } from "zustand";

import { sendRecitation, subscribeRecitation } from "./recitation-player";

// The Quranic Duas list plays through the reader's recitation: each dua is a
// range of ayat recited once, and the queue starts the next dua when the one
// before it ends. The queue lives here, not in the screen, so the list goes
// on playing when the Believer leaves it.

interface QueueStore {
  queue: DuaQueue | null;
  reciter: string;
}

const useQueueStore = create<QueueStore>(() => ({ queue: null, reciter: "" }));

let listening = false;

const listen = () => {
  if (listening) {
    return;
  }
  listening = true;
  subscribeRecitation((previous, next, event) => {
    const { queue, reciter } = useQueueStore.getState();
    if (!queue) {
      return;
    }
    const step = stepDuaQueue(queue, previous, next, event);
    useQueueStore.setState({ queue: step.queue });
    if (step.play) {
      sendRecitation(playDuaEvent(step.play, reciter));
    }
  });
};

/** Recites the duas one after another, from the first, in `reciter`'s voice. */
export const playQuranicDuas = (duas: readonly DuaRange[], reciter: string) => {
  const queue = startDuaQueue(duas);
  const first = queue?.duas[0];
  if (!(queue && first)) {
    return;
  }
  listen();
  useQueueStore.setState({ queue, reciter });
  sendRecitation(playDuaEvent(first, reciter));
};

/** Stops the list and whatever it is reciting. */
export const stopQuranicDuas = () => {
  useQueueStore.setState({ queue: null });
  sendRecitation({ type: "stop" });
};

/** The dua the list is reciting, or null when it is not playing. */
export const useRecitingDua = (): DuaRange | null =>
  useQueueStore((state) => state.queue?.duas[state.queue.index] ?? null);

/** Whether the list is playing more than the one dua. */
export const useDuaQueueRemaining = (): number =>
  useQueueStore((state) =>
    state.queue ? state.queue.duas.length - state.queue.index - 1 : 0
  );
