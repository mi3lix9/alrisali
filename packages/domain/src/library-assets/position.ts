import type { LibraryAssetKind } from "./library-asset";

/**
 * How close to its end audio or video counts as played through: reopening it
 * then starts it over rather than in its closing seconds.
 */
export const FINISHED_MARGIN_SECONDS = 10;

/**
 * Where a Library Asset opens, from the position the Believer saved (null
 * when never opened) and the asset's length once known (null before). A
 * position is a page (PDF, from 1), a second (audio, video) or a block of
 * structured text (from 0).
 */
export const resumePosition = (
  kind: LibraryAssetKind,
  saved: number | null,
  length: number | null
): number => {
  switch (kind) {
    case "pdf": {
      const page = Math.max(1, Math.floor(saved ?? 1));
      return length === null ? page : Math.min(page, Math.max(1, length));
    }
    case "audio":
    case "video": {
      const second = Math.max(0, saved ?? 0);
      return length !== null && second >= length - FINISHED_MARGIN_SECONDS
        ? 0
        : second;
    }
    case "text": {
      const block = Math.max(0, Math.floor(saved ?? 0));
      return length === null ? block : Math.min(block, Math.max(0, length - 1));
    }
    default: {
      const unknown: never = kind;
      throw new Error(`No position for ${String(unknown)}`);
    }
  }
};
