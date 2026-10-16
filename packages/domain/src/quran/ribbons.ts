import { findAyah } from "./mushaf";
import type { AyahKey } from "./mushaf";

/** The six Bookmark Ribbons, in the order the ayah sheet lists them. */
export const RIBBON_COLORS = [
  "red",
  "yellow",
  "green",
  "blue",
  "orange",
  "purple",
] as const;

export type RibbonColor = (typeof RIBBON_COLORS)[number];

/** The longest name a Believer can give a ribbon. */
export const RIBBON_NAME_MAX = 40;

/**
 * One of the six Bookmark Ribbons: it rests on at most one ayah, and
 * setting its colour on another ayah moves it there.
 */
export interface BookmarkRibbon {
  color: RibbonColor;
  /** The Believer's own name; null shows the colour's default name. */
  name: string | null;
  /** Where the ribbon rests; null while it is unused. */
  ayah: AyahKey | null;
  /** ISO instant the ribbon was last moved or renamed; null while unused. */
  updatedAt: string | null;
}

export const isRibbonColor = (value: string): value is RibbonColor =>
  (RIBBON_COLORS as readonly string[]).includes(value);

const unused = (color: RibbonColor): BookmarkRibbon => ({
  color,
  name: null,
  ayah: null,
  updatedAt: null,
});

/** All six ribbons, unused. */
export const emptyRibbons = (): BookmarkRibbon[] => RIBBON_COLORS.map(unused);

/**
 * Exactly six ribbons, in colour order, from whatever rows are stored: a
 * missing colour is unused, and an ayah this mushaf does not have (synced
 * from a newer one) leaves its ribbon unused.
 */
export const normaliseRibbons = (
  stored: readonly BookmarkRibbon[]
): BookmarkRibbon[] =>
  RIBBON_COLORS.map((color) => {
    const row = stored.find((ribbon) => ribbon.color === color);
    if (!row) {
      return unused(color);
    }
    const ayah = row.ayah ? (findAyah(row.ayah)?.key ?? null) : null;
    return { ...row, ayah };
  });

const replace = (
  ribbons: readonly BookmarkRibbon[],
  color: RibbonColor,
  change: (ribbon: BookmarkRibbon) => BookmarkRibbon
): BookmarkRibbon[] =>
  normaliseRibbons(ribbons).map((ribbon) =>
    ribbon.color === color ? change(ribbon) : ribbon
  );

/**
 * Puts the ribbon of this colour on the ayah, taking it off wherever it was.
 * Another colour already on the ayah stays: an ayah may hold several.
 */
export const moveRibbon = (
  ribbons: readonly BookmarkRibbon[],
  color: RibbonColor,
  ayah: AyahKey,
  now: Date
): BookmarkRibbon[] => {
  const found = findAyah(ayah);
  if (!found) {
    throw new Error(`No ayah ${ayah} in the mushaf`);
  }
  return replace(ribbons, color, (ribbon) => ({
    ...ribbon,
    ayah: found.key,
    updatedAt: now.toISOString(),
  }));
};

/** Takes the ribbon off its ayah; it keeps its name. */
export const clearRibbon = (
  ribbons: readonly BookmarkRibbon[],
  color: RibbonColor,
  now: Date
): BookmarkRibbon[] =>
  replace(ribbons, color, (ribbon) => ({
    ...ribbon,
    ayah: null,
    updatedAt: now.toISOString(),
  }));

/** A name as stored: trimmed and capped; blank clears it to the default. */
export const cleanRibbonName = (name: string): string | null => {
  const trimmed = name.trim().slice(0, RIBBON_NAME_MAX).trim();
  return trimmed === "" ? null : trimmed;
};

/** Names the ribbon; a blank name restores the colour's default. */
export const renameRibbon = (
  ribbons: readonly BookmarkRibbon[],
  color: RibbonColor,
  name: string,
  now: Date
): BookmarkRibbon[] =>
  replace(ribbons, color, (ribbon) => ({
    ...ribbon,
    name: cleanRibbonName(name),
    updatedAt: now.toISOString(),
  }));

/**
 * The colours resting on each ayah, the most recently set first. Ayat with
 * no ribbon are absent.
 */
export const ribbonColorsByAyah = (
  ribbons: readonly BookmarkRibbon[]
): Map<AyahKey, RibbonColor[]> => {
  const placed = normaliseRibbons(ribbons)
    .filter(
      (ribbon): ribbon is BookmarkRibbon & { ayah: AyahKey } =>
        ribbon.ayah !== null
    )
    .toSorted((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  const byAyah = new Map<AyahKey, RibbonColor[]>();
  for (const { ayah, color } of placed) {
    byAyah.set(ayah, [...(byAyah.get(ayah) ?? []), color]);
  }
  return byAyah;
};
