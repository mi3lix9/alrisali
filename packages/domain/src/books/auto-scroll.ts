/** Pixels per second at each speed, slowest first; speeds are numbered from 1. */
export const AUTO_SCROLL_SPEEDS: readonly number[] = [12, 20, 30, 44, 64, 90];

/** The speed auto-scroll starts at. */
export const DEFAULT_AUTO_SCROLL_SPEED = 3;

/** Moves one speed up (+1) or down (-1), staying within the offered speeds. */
export const stepAutoScrollSpeed = (speed: number, direction: 1 | -1) =>
  Math.min(AUTO_SCROLL_SPEEDS.length, Math.max(1, speed + direction));

/**
 * Where auto-scroll is after a frame: down by the speed's pixels per second
 * over the elapsed time, never past the end of the text.
 */
export const advanceAutoScroll = ({
  offset,
  speed,
  elapsedMs,
  maxOffset,
}: {
  offset: number;
  speed: number;
  elapsedMs: number;
  /** The furthest the text can scroll; 0 or less when it fits the screen. */
  maxOffset: number;
}): { offset: number; finished: boolean } => {
  const end = Math.max(0, maxOffset);
  const pixelsPerSecond = AUTO_SCROLL_SPEEDS[speed - 1] ?? 0;
  const next = Math.min(
    end,
    offset + (pixelsPerSecond * Math.max(0, elapsedMs)) / 1000
  );
  return { offset: next, finished: next >= end };
};
