import { SAJDAH } from "@alrisali/content/quran";
import { ribbonColorsByAyah } from "@alrisali/domain/quran";
import type { AyahKey } from "@alrisali/domain/quran";
import { useMemo } from "react";

import { useRibbons } from "../data/ribbons";
import { mergeDecorations } from "../utils/decorations";
import type { AyahDecoration, AyahDecorations } from "../utils/decorations";

/** The sajdah ayat, each with its obligatory or recommended marker. */
const SAJDAH_DECORATIONS: AyahDecorations = new Map(
  SAJDAH.map(({ ayah, kind }) => [
    ayah,
    [{ kind: "sajdah", obligatory: kind === "obligatory" }] as const,
  ])
);

/**
 * Every decoration the reader draws on its rosettes: this feature's own
 * (Bookmark Ribbons, sajdah) merged with those the route hands in from other
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
    return mergeDecorations(SAJDAH_DECORATIONS, own, fromRoute);
  }, [ribbons, fromRoute]);
};
