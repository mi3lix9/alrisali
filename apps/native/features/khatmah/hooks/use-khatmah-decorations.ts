import type { AyahKey } from "@alrisali/content/quran";
import { useMemo } from "react";

import { portionMarks } from "../utils/portion-marks";
import type { KhatmahDecoration } from "../utils/portion-marks";
import { useActiveKhatmah } from "./use-active-khatmah";

export type { KhatmahDecoration } from "../utils/portion-marks";

/**
 * The reader's decorations for today's portion: its first ayah, where the
 * Believer starts, and its last, where they stop, carry a mark. Empty
 * without an unfinished Khatmah.
 */
export const useKhatmahDecorations = (): ReadonlyMap<
  AyahKey,
  readonly KhatmahDecoration[]
> => {
  const active = useActiveKhatmah();
  const from = active?.status.current?.from;
  const to = active?.status.current?.to;
  return useMemo(
    () => portionMarks(from && to ? { from, to } : null),
    [from, to]
  );
};
