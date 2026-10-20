// Overlapping download jobs (a surah, its juz, the whole Quran) can name the
// same file. Transfers to one destination run one after another, so they never
// share a `.part` file, and the later one finds the file already stored.

/** Runs tasks of one key in order; tasks of different keys do not wait for each other. */
export const createKeyedSerial = () => {
  const tails = new Map<string, Promise<unknown>>();
  return {
    async run<T>(key: string, task: () => Promise<T>): Promise<T> {
      const previous = tails.get(key);
      const result = (async () => {
        try {
          await previous;
        } catch {
          // The earlier task's failure is its own.
        }
        return task();
      })();
      tails.set(key, result);
      try {
        return await result;
      } finally {
        if (tails.get(key) === result) {
          tails.delete(key);
        }
      }
    },
  };
};
