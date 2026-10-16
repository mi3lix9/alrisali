import { PAGE_COUNT } from "./mushaf";

/**
 * Two-page spread: on a wide landscape screen the reader shows the right and
 * left pages of an open mushaf side by side. Pages 1 and 2 are the opening
 * pair, so a spread holds an odd page (right) and the even page after it (left).
 */

/** The narrowest width, in dp, at which a spread keeps its pages readable. */
export const SPREAD_MIN_WIDTH = 900;

/** The short side, in dp, from which a device is a tablet or unfolded foldable. */
export const WIDE_SCREEN_SHORT_SIDE = 600;

export const SPREAD_COUNT = Math.ceil(PAGE_COUNT / 2);

export interface ScreenSize {
  width: number;
  height: number;
}

/** Whether a screen of this size shows pages two at a time. */
export const showsSpread = ({ width, height }: ScreenSize): boolean =>
  width > height && width >= SPREAD_MIN_WIDTH;

/** Whether the device is wide enough to let the reader turn to landscape. */
export const canRotateReader = ({ width, height }: ScreenSize): boolean =>
  Math.min(width, height) >= WIDE_SCREEN_SHORT_SIDE;

/** The spread (1-based) holding a page. */
export const spreadOfPage = (page: number): number => Math.ceil(page / 2);

/** The pages of a spread: the right page, then the left one (none after 604). */
export const pagesOfSpread = (spread: number): readonly number[] =>
  [spread * 2 - 1, spread * 2].filter((page) => page <= PAGE_COUNT);

/** The page the reader reports as shown when a spread is: the right page. */
export const shownPageOfSpread = (spread: number): number => spread * 2 - 1;
