const ARABIC_INDIC_ZERO = 0x06_60;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06_f0;
const ARABIC_DIGIT = /[\u0660-\u0669\u06F0-\u06F9]/gu;
const ARABIC_DECIMAL_SEPARATOR = /\u066B/gu;
const ARABIC_MINUS = /[\u2212\u2012]/gu;
const NUMBER = /^-?\d+(?:\.\d+)?$/u;

/**
 * Reads a typed coordinate, Arabic-Indic digits and separator included.
 * Returns null when the text is not a plain decimal number.
 */
export const parseCoordinate = (text: string): number | null => {
  const normalized = text
    .trim()
    .replaceAll(ARABIC_DIGIT, (digit) => {
      const code = digit.codePointAt(0) ?? ARABIC_INDIC_ZERO;
      const zero =
        code >= EXTENDED_ARABIC_INDIC_ZERO
          ? EXTENDED_ARABIC_INDIC_ZERO
          : ARABIC_INDIC_ZERO;
      return String(code - zero);
    })
    .replaceAll(ARABIC_DECIMAL_SEPARATOR, ".")
    .replaceAll(ARABIC_MINUS, "-");
  return NUMBER.test(normalized) ? Number(normalized) : null;
};
