import { formatNumber } from "@/shared/lib/numbers";

const DIRECTIONS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
const DEGREES_PER_DIRECTION = 45;

/** Degrees or kilometres, rounded to a whole number. */
export const formatWholeNumber = (value: number): string =>
  formatNumber(value, { maximumFractionDigits: 0 });

/** The compass sector (of eight) a bearing from north points into. */
export const bearingSector = (bearing: number) =>
  DIRECTIONS[Math.round(bearing / DEGREES_PER_DIRECTION) % DIRECTIONS.length] ??
  "n";
