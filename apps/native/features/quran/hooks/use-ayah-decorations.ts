import { ribbonColorsByAyah } from "@alrisali/domain/quran";
import type { AyahKey } from "@alrisali/domain/quran";
import { useMemo } from "react";

import { useRibbons } from "../data/ribbons";
import { mergeDecorations } from "../utils/decorations";
import type { AyahDecoration, AyahDecorations } from "../utils/decorations";

/**
 * Every decoration the reader draws on its rosettes: this feature's own
 * (Bookmark Ribbons) merged with those the route hands in from other
 * features (e.g. a Khatmah Portion's end).
 */
export const useAyahDecorations = (
  fromRoute?: AyahDecorations
): AyahDecorations => {
  const ribbons = useRibbons().data;
  return useMemo(() => {
    const own = new Map<AyahKey, readonly AyahDecoration[]>();
    for (const [ayah, colors] of ribbonColorsByAyah(ribbons ?? [])) {
      own.set(
        ayah,
        colors.map((color) => ({ kind: "ribbon", color }) as const)
      );
    }
    return mergeDecorations(own, fromRoute);
  }, [ribbons, fromRoute]);
};
