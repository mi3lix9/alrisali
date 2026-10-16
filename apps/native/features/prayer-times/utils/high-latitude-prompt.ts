import { z } from "zod";

const seenSchema = z.array(z.string());

/** The countries the Believer was already prompted for, from the stored JSON. */
export const readSeenCountries = (stored: string | null): string[] => {
  if (stored === null) {
    return [];
  }
  try {
    const parsed = seenSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
};

/** Whether a country still gets the prompt: one that is known and not yet seen. */
export const needsHighLatitudePrompt = (
  country: string | null | undefined,
  seen: readonly string[]
): country is string => Boolean(country) && !seen.includes(country as string);

/** The stored JSON after the prompt was shown for `country`. */
export const withSeenCountry = (
  seen: readonly string[],
  country: string
): string => JSON.stringify(seen.includes(country) ? seen : [...seen, country]);
