import type { AyahKey } from "@alrisali/content/quran";
import { useMemo } from "react";

import { useActiveKhatmah } from "./use-active-khatmah";

/** What the reader draws on an ayah for the Khatmah: today's portion's end. */
export interface KhatmahDecoration {
  kind: "khatmah-portion";
}

/**
 * The reader's decorations for today's portion: its last ayah, where the
 * Believer stops, carries a mark. Empty without an unfinished Khatmah.
 */
export const useKhatmahDecorations = (): ReadonlyMap<
  AyahKey,
  readonly KhatmahDecoration[]
> => {
  const active = useActiveKhatmah();
  const end = active?.status.current?.to;
  return useMemo(
    () =>
      new Map<AyahKey, readonly KhatmahDecoration[]>(
        end ? [[end, [{ kind: "khatmah-portion" }]]] : []
      ),
    [end]
  );
};
