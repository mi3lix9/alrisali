import type { AlertType } from "@alrisali/domain/reminders";
import {
  AudioLinesIcon,
  BellIcon,
  MoonIcon,
  XIcon,
} from "panelui-native/icons";
import { useCSSVariable } from "uniwind";

const ICONS = {
  off: XIcon,
  silent: BellIcon,
  tone: AudioLinesIcon,
  adhan: MoonIcon,
} as const;

/** The glyph of an alert type, painted in a theme token's colour. */
export const AlertTypeIcon = ({
  type,
  size = 18,
  tone = "muted-foreground",
}: {
  type: AlertType;
  size?: number;
  /** The theme colour token to paint with. */
  tone?: "muted-foreground" | "primary-foreground" | "foreground";
}) => {
  const color = useCSSVariable(`--color-${tone}`);
  const Icon = ICONS[type];
  return <Icon size={size} {...(typeof color === "string" ? { color } : {})} />;
};
