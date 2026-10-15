/**
 * Runs `run` once `delayMs` after the last of a burst of `schedule` calls,
 * e.g. one sync after the Believer records several things in a row.
 */
export const createDebouncedTask = ({
  run,
  delayMs,
}: {
  run: () => unknown;
  delayMs: number;
}) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
  };
  return {
    schedule: (): void => {
      cancel();
      timer = setTimeout(() => {
        timer = undefined;
        run();
      }, delayMs);
    },
    /** Drops a scheduled run that has not started yet. */
    cancel,
  };
};
