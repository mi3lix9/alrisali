import { z } from "zod";

const SURAH_COUNT = 114;

/** What a Believer can keep as a Favorite. Add a kind here to favourite more. */
export const FAVORITE_KINDS = [
  "surah",
  "ayah",
  "supplication",
  "library-asset",
] as const;

export type FavoriteKind = (typeof FAVORITE_KINDS)[number];

const surahNumber = z.coerce.number().int().min(1).max(SURAH_COUNT);

/** A Surah's number, as text: `"18"`. */
const surahKey = z
  .string()
  .regex(/^\d+$/u)
  .refine((key) => surahNumber.safeParse(key).success, "No such Surah");

/** An AyahKey, `surah:ayah`: `"2:255"`. */
const ayahKey = z
  .string()
  .regex(/^(?<surah>\d+):(?<ayah>\d+)$/u)
  .refine((key) => {
    const [surah, ayah] = key.split(":");
    return surahNumber.safeParse(surah).success && Number(ayah) >= 1;
  }, "No such ayah");

const contentId = z.string().trim().min(1);

/**
 * One favourited thing: its kind and the key that names it in that kind's
 * content (a Surah number, an AyahKey, a Supplication id, a Library Asset id).
 */
export const favoriteItemSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("surah"), key: surahKey }),
  z.object({ kind: z.literal("ayah"), key: ayahKey }),
  z.object({ kind: z.literal("supplication"), key: contentId }),
  z.object({ kind: z.literal("library-asset"), key: contentId }),
]);

export type FavoriteItem = z.infer<typeof favoriteItemSchema>;

/**
 * The Favorite's row id. Derived from the item, so favouriting the same thing
 * on two devices makes one Favorite once they sync.
 */
export const favoriteId = ({ kind, key }: FavoriteItem): string =>
  `${kind}:${key}`;
