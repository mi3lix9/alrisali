import { z } from "zod";

/** The app's colour theme: the device's, or always light or dark. */
export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export const themePreferenceSchema = z.enum(THEME_PREFERENCES);
