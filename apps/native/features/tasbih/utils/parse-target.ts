import { parseNumber } from "@/shared/lib/numbers";

/**
 * Reads a typed Open Tasbih target, Arabic-Indic digits included: null when
 * left blank, NaN when it is not a whole number (the schema then rejects it).
 */
export const parseTarget = (text: string): number | null => {
  if (text.trim() === "") {
    return null;
  }
  const target = parseNumber(text);
  return Number.isInteger(target) ? target : Number.NaN;
};
