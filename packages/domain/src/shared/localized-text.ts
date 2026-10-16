import { z } from "zod";

/** Text Admins write in Arabic, with an optional English version. */
export const localizedTextSchema = z.object({
  ar: z.string().trim().min(1),
  en: z.string().trim(),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** Optional text in both languages; empty when the Admin left it out. */
export const optionalLocalizedTextSchema = z.object({
  ar: z.string().trim(),
  en: z.string().trim(),
});

/** The text in the Believer's language, Arabic when there is no English. */
export const localized = (
  text: { ar: string; en: string },
  language: "ar" | "en"
): string => (language === "en" && text.en ? text.en : text.ar);
