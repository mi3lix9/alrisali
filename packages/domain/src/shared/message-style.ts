import { z } from "zod";

/**
 * The voice the app speaks in: Classic quotes scriptural sources, Modern
 * coaches gently. Reminders, Habits and the Companion all read it.
 */
export const MESSAGE_STYLES = ["classic", "modern"] as const;

export type MessageStyle = (typeof MESSAGE_STYLES)[number];

export const DEFAULT_MESSAGE_STYLE: MessageStyle = "classic";

export const messageStyleSchema = z.enum(MESSAGE_STYLES);
