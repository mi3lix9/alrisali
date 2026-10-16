/** The languages Al-Risali speaks. Arabic comes first: it is the default. */
export const LANGUAGES = ["ar", "en"] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "ar";

export type TextDirection = "rtl" | "ltr";

const DIRECTIONS: Record<Language, TextDirection> = { ar: "rtl", en: "ltr" };

export const textDirection = (language: Language): TextDirection =>
  DIRECTIONS[language];

/**
 * A translation of a source catalogue: exactly its keys, every leaf a string.
 * Write the Arabic catalogue first and type the English one as
 * `Catalog<typeof ar>`, so a key missing from either side fails type-check.
 */
export type Catalog<Source> = {
  readonly [Key in keyof Source]: Source[Key] extends string
    ? string
    : Catalog<Source[Key]>;
};
