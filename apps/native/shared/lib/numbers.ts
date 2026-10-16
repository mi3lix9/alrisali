import { writeDigits } from "@alrisali/domain/shared";
import type { Digits } from "@alrisali/domain/shared";
import type { Language } from "@alrisali/i18n";

import { launchLanguage, usePreferences } from "./preferences";

// Every number the app shows (counts, times, dates, page numbers) is written
// here, in the digits the Believer picked for the Arabic interface; English is
// always written in Western digits. Intl is asked for Western digits and the
// result is then rewritten digit by digit: Hermes may ignore a locale's
// `-u-nu-` extension and the `numberingSystem` option, and CLDR's Arabic now
// defaults to Western digits, so Intl alone cannot be trusted with either
// choice. Translated strings get the same digits from the i18n formatter
// (shared/lib/i18n), which writes every number interpolated into them.
//
// How each choice writes the digits, separators and percent sign:
// writeDigits (@alrisali/domain/shared).

/** The digits `language` is written in: English always Western. */
export const digitsFor = (language: Language, chosen: Digits): Digits =>
  language === "ar" ? chosen : "latin";

/** The digits the interface is written in now. */
export const currentDigits = (): Digits =>
  digitsFor(launchLanguage, usePreferences.getState().digits);

/**
 * The digits the interface is written in, re-rendering when the Believer
 * changes them. Components that format numbers without `t()` and memoise the
 * result depend on this.
 */
export const useDigits = (): Digits =>
  digitsFor(
    launchLanguage,
    usePreferences((state) => state.digits)
  );

/** Text holding Western or Arabic-Indic digits, in the interface's digits. */
export const localizeDigits = (text: string): string =>
  writeDigits(text, currentDigits());

const numberFormats = new Map<string, Intl.NumberFormat>();

/** A number in the interface's language and digits: "١٬٢٣٤" or "1,234". */
export const formatNumber = (
  value: number,
  options: Intl.NumberFormatOptions = {}
): string => {
  const key = JSON.stringify(options);
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(launchLanguage, {
      ...options,
      numberingSystem: "latn",
    });
    numberFormats.set(key, format);
  }
  return localizeDigits(format.format(value));
};

/** A Temporal value, which formats itself, or a moment as a Date. */
export type DateTimeValue =
  | Date
  | number
  | {
      toLocaleString: (
        locales?: string,
        options?: Intl.DateTimeFormatOptions
      ) => string;
    };

const dateTimeFormats = new Map<string, Intl.DateTimeFormat>();

/** A date or time in the interface's language and digits. */
export const formatDateTime = (
  value: DateTimeValue,
  options: Intl.DateTimeFormatOptions
): string => {
  const latin = { ...options, numberingSystem: "latn" };
  if (typeof value === "number" || value instanceof Date) {
    const key = JSON.stringify(options);
    let format = dateTimeFormats.get(key);
    if (!format) {
      format = new Intl.DateTimeFormat(launchLanguage, latin);
      dateTimeFormats.set(key, format);
    }
    return localizeDigits(format.format(value));
  }
  return localizeDigits(value.toLocaleString(launchLanguage, latin));
};
