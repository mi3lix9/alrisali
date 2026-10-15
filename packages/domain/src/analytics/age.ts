// The optional birth year a Believer may give, so the team can see the age
// range of its users. Ages are counted in whole years from the birth year
// alone (no birthday), which is close enough for the bands below.

/** The earliest birth year accepted. */
export const BIRTH_YEAR_MIN = 1900;

export const AGE_BANDS = [
  "under-18",
  "18-25",
  "26-35",
  "36-50",
  "over-50",
] as const;

export type AgeBand = (typeof AGE_BANDS)[number];

const BAND_LIMITS: readonly [maxAge: number, band: AgeBand][] = [
  [17, "under-18"],
  [25, "18-25"],
  [35, "26-35"],
  [50, "36-50"],
];

/** A birth year from 1900 up to the current year. */
export const isBirthYear = (year: number, currentYear: number): boolean =>
  Number.isInteger(year) && year >= BIRTH_YEAR_MIN && year <= currentYear;

/** The band a birth year falls in, counted in `currentYear`. */
export const ageBandOf = (birthYear: number, currentYear: number): AgeBand => {
  const age = currentYear - birthYear;
  return BAND_LIMITS.find(([maxAge]) => age <= maxAge)?.[1] ?? "over-50";
};

/** Reads typed text as a birth year: `null` when blank or not plausible. */
export const parseBirthYear = (
  text: string,
  currentYear: number
): number | null => {
  const trimmed = text.trim();
  if (!/^\d{4}$/u.test(trimmed)) {
    return null;
  }
  const year = Number(trimmed);
  return isBirthYear(year, currentYear) ? year : null;
};
