import type { OccasionType } from "@alrisali/domain/shared";
import type { BadgeProps } from "panelui-native";

/** Each Occasion type's colour: a grid dot and a badge. */
export const OCCASION_STYLE: Record<
  OccasionType,
  { dot: string; badge: NonNullable<BadgeProps["variant"]> }
> = {
  celebration: { dot: "bg-success", badge: "success" },
  mourning: { dot: "bg-foreground", badge: "secondary" },
  religious: { dot: "bg-info", badge: "info" },
  fasting: { dot: "bg-warning", badge: "warning" },
};
