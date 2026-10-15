import type { GatheringType } from "@alrisali/domain/gatherings";
import type { BadgeProps } from "panelui-native";

/** Each Gathering type's badge colour. */
export const GATHERING_BADGE: Record<
  GatheringType,
  NonNullable<BadgeProps["variant"]>
> = {
  majlis: "info",
  lecture: "default",
  celebration: "success",
  mourning: "secondary",
};
