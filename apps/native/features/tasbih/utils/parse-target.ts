const ARABIC_INDIC_ZERO = 0x06_60;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06_f0;
const ARABIC_DIGIT = /[\u0660-\u0669\u06F0-\u06F9]/gu;
const WHOLE_NUMBER = /^\d+$/u;

/**
 * Reads a typed Open Tasbih target, Arabic-Indic digits included: null when
 * left blank, NaN when it is not a whole number (the schema then rejects it).
 */
export const parseTarget = (text: string): number | null => {
  const normalized = text.trim().replaceAll(ARABIC_DIGIT, (digit) => {
    const code = digit.codePointAt(0) ?? ARABIC_INDIC_ZERO;
    const zero =
      code >= EXTENDED_ARABIC_INDIC_ZERO
        ? EXTENDED_ARABIC_INDIC_ZERO
        : ARABIC_INDIC_ZERO;
    return String(code - zero);
  });
  if (normalized === "") {
    return null;
  }
  return WHOLE_NUMBER.test(normalized) ? Number(normalized) : Number.NaN;
};
