import type { AyahKey, RibbonColor } from "@alrisali/domain/quran";

/**
 * What marks an ayah on the page, drawn on its rosette (the ayah-end sign).
 * Every feature that marks ayat adds entries to one `AyahDecorations` map
 * and the page views draw them all through `rosetteColor`; none adds its own
 * prop to the views.
 */
export type AyahDecoration =
  /** A Bookmark Ribbon rests on the ayah. */
  | { kind: "ribbon"; color: RibbonColor }
  /** The Believer wrote an Ayah Note on it. */
  | { kind: "note" }
  /** A prostration (sajdah) is due at the ayah: wajib or mustahabb. */
  | { kind: "sajdah"; obligatory: boolean }
  /** The ayah ends today's Khatmah Portion. */
  | { kind: "khatmah-portion" };

export type AyahDecorations = ReadonlyMap<AyahKey, readonly AyahDecoration[]>;

/** The six ribbon colours as they are printed on the rosette. */
export const RIBBON_HEX: Record<RibbonColor, string> = {
  red: "#d9483b",
  yellow: "#e0a800",
  green: "#1f9d63",
  blue: "#2f6fe0",
  orange: "#e6731d",
  purple: "#7a4fd6",
};

/** An obligatory sajdah rosette is crimson, a recommended one amber. */
export const SAJDAH_HEX = { obligatory: "#a61e4d", recommended: "#b45309" };

const DECORATION_HEX = {
  note: "#6b7a90",
  "khatmah-portion": "#0f9ba8",
} as const;

/** The colour a decoration tints the rosette. */
const tint = (decoration: AyahDecoration): string => {
  if (decoration.kind === "ribbon") {
    return RIBBON_HEX[decoration.color];
  }
  if (decoration.kind === "sajdah") {
    return decoration.obligatory
      ? SAJDAH_HEX.obligatory
      : SAJDAH_HEX.recommended;
  }
  return DECORATION_HEX[decoration.kind];
};

/** Which decoration wins the rosette when an ayah has several. */
const PRIORITY: readonly AyahDecoration["kind"][] = [
  "ribbon",
  "khatmah-portion",
  "sajdah",
  "note",
];

/**
 * The colour to draw an ayah's rosette in, or undefined when it carries no
 * decoration. A ribbon outranks the rest; among ribbons, the first listed.
 */
export const rosetteColor = (
  decorations: readonly AyahDecoration[] | undefined
): string | undefined => {
  const [winner] = PRIORITY.flatMap((kind) =>
    (decorations ?? []).filter((decoration) => decoration.kind === kind)
  );
  return winner ? tint(winner) : undefined;
};

/** One map from several, concatenating the entries of an ayah in order. */
export const mergeDecorations = (
  ...maps: readonly (AyahDecorations | undefined)[]
): AyahDecorations => {
  const merged = new Map<AyahKey, readonly AyahDecoration[]>();
  for (const map of maps) {
    for (const [ayah, decorations] of map ?? []) {
      merged.set(ayah, [...(merged.get(ayah) ?? []), ...decorations]);
    }
  }
  return merged;
};
