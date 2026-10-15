/** The text sizes a Believer can pick, smallest first. */
export const TEXT_SIZES = ["small", "default", "large", "larger"] as const;

export type TextSize = (typeof TEXT_SIZES)[number];

export const DEFAULT_TEXT_SIZE: TextSize = "default";

/** How much each text size scales the app's type, relative to the default. */
export const TEXT_SCALE: Record<TextSize, number> = {
  small: 0.875,
  default: 1,
  large: 1.125,
  larger: 1.25,
};
