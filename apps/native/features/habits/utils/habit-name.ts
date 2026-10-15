import type { Habit } from "@alrisali/domain/habits";
import type { TFunction } from "i18next";

/** The Believer's own name, or a default Habit's name in the app language. */
export const habitName = (
  { name, preset }: Pick<Habit, "name" | "preset">,
  t: TFunction<"habits">
): string => (preset ? t(`preset.${preset}`) : (name ?? ""));
