import type { Language } from "@alrisali/i18n";
import type { TFunction } from "i18next";

import { formatNumber } from "@/shared/lib/numbers";

/** "5 minutes" in the plural form `language` uses for the count. */
export const minutesPhrase = (
  t: TFunction<"reminders">,
  language: Language,
  count: number
): string => {
  const form = new Intl.PluralRules(language).select(count);
  return t(`minutes.${form}`, {
    count: formatNumber(count),
  });
};
