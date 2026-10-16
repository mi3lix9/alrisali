import type { AmalEntry, AmalKind } from "../types";

// The A'mal index: in-house, keyed by Hijri month and day (day 0 = the whole
// month), pointing at bundled Supplications by stable id. It lists only acts
// whose text is bundled and whose date is not in doubt. Mafatih's month
// chapters (Rajab, Sha'ban, Ramadan, Muharram…) and the fasts, prayers and
// tasbih they describe join as their texts are imported.

export const AMAL_KINDS: readonly AmalKind[] = [
  "dua",
  "ziyarah",
  "prayer",
  "fast",
  "tasbih",
];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Sahifa 43, said on seeing the new crescent: the eve of every month's 1st. */
const NEW_CRESCENT: AmalEntry[] = MONTHS.map((month) => ({
  month,
  day: 1,
  kind: "dua",
  time: "night",
  supplicationId: "sahifa-43",
}));

export const AMAL: readonly AmalEntry[] = [
  ...NEW_CRESCENT,
  // Muharram 10, the day of Ashura.
  { month: 1, day: 10, kind: "ziyarah", supplicationId: "mafatih-ziyarat-ashura" },
  // Safar 20, Arba'in.
  { month: 2, day: 20, kind: "ziyarah", supplicationId: "mafatih-ziyarat-arbaeen" },
  // The night of mid-Sha'ban.
  { month: 8, day: 15, kind: "dua", time: "night", supplicationId: "mafatih-dua-kumayl" },
  // Every night of Ramadan.
  { month: 9, day: 0, kind: "dua", time: "night", supplicationId: "mafatih-dua-iftitah" },
  // The coming of Ramadan.
  { month: 9, day: 1, kind: "dua", supplicationId: "sahifa-44" },
  // Eid al-Fitr: Dua al-Nudba is for the four Eids (Friday, Fitr, Adha, Ghadir).
  { month: 10, day: 1, kind: "dua", supplicationId: "sahifa-46" },
  { month: 10, day: 1, kind: "dua", supplicationId: "mafatih-dua-nudba" },
  // The day of Arafa.
  { month: 12, day: 9, kind: "dua", time: "day", supplicationId: "sahifa-47" },
  // Eid al-Adha.
  { month: 12, day: 10, kind: "dua", supplicationId: "sahifa-48" },
  { month: 12, day: 10, kind: "dua", supplicationId: "mafatih-dua-nudba" },
  // Eid al-Ghadir.
  { month: 12, day: 18, kind: "dua", supplicationId: "mafatih-dua-nudba" },
];
