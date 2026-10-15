import type { OccasionType } from "@alrisali/domain/shared";

export const OCCASION_TYPE_LABELS = {
  celebration: "Celebration",
  mourning: "Mourning",
  religious: "Religious",
  fasting: "Fasting",
} as const satisfies Record<OccasionType, string>;
