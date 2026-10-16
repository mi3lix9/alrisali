import { z } from "zod";

/**
 * The digits numbers are written in: Arabic-Indic (٠–٩) or Western (0–9).
 * The Believer picks them for the Arabic interface; English is always
 * written in Western digits.
 */
export const DIGITS = ["arabic-indic", "latin"] as const;

export type Digits = (typeof DIGITS)[number];

export const DEFAULT_DIGITS: Digits = "arabic-indic";

export const digitsSchema = z.enum(DIGITS);

const ARABIC_INDIC_ZERO = 0x06_60;
const WESTERN_ZERO = 0x30;

const TO_ARABIC_SEPARATOR: Record<string, string> = { ".": "٫", ",": "٬" };
const TO_WESTERN_SEPARATOR: Record<string, string> = { "٫": ".", "٬": "," };

/**
 * Rewrites the digits of already formatted text, Western or Arabic-Indic,
 * into `digits`. Arabic-Indic digits come with the Arabic decimal and
 * thousands separators (٫ ٬) between them and the Arabic percent sign (٪);
 * Western digits with ". , %". Other punctuation (the ":" of a time, "/" or
 * "–") is kept, as is a "." or "," not between two digits.
 */
export const writeDigits = (text: string, digits: Digits): string =>
  digits === "arabic-indic"
    ? text
        .replaceAll(
          /\d[.,](?=\d)/gu,
          ([digit = "", separator = ""]) =>
            `${digit}${TO_ARABIC_SEPARATOR[separator] ?? separator}`
        )
        .replaceAll(/\d/gu, (digit) =>
          String.fromCodePoint(
            ARABIC_INDIC_ZERO + (digit.codePointAt(0) ?? 0) - WESTERN_ZERO
          )
        )
        .replaceAll("%", "٪")
    : text
        .replaceAll(
          /[٠-٩][٫٬](?=[٠-٩])/gu,
          ([digit = "", separator = ""]) =>
            `${digit}${TO_WESTERN_SEPARATOR[separator] ?? separator}`
        )
        .replaceAll(/[٠-٩]/gu, (digit) =>
          String.fromCodePoint(
            WESTERN_ZERO + (digit.codePointAt(0) ?? 0) - ARABIC_INDIC_ZERO
          )
        )
        .replaceAll("٪", "%");
