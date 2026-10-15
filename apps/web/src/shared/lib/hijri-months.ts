import type { HijriMonth } from "@alrisali/domain/shared";

/** Hijri month names as the admin screens write them. */
export const HIJRI_MONTH_NAMES = {
  1: "Muharram",
  2: "Safar",
  3: "Rabi al-Awwal",
  4: "Rabi al-Thani",
  5: "Jumada al-Ula",
  6: "Jumada al-Akhirah",
  7: "Rajab",
  8: "Shaban",
  9: "Ramadan",
  10: "Shawwal",
  11: "Dhu al-Qadah",
  12: "Dhu al-Hijjah",
} as const satisfies Record<HijriMonth, string>;
