import type { ReaderTheme } from "@alrisali/domain/books";

export interface ReaderColors {
  background: string;
  text: string;
}

/**
 * The page and ink of each fixed reading theme; `system` has none and follows
 * the app's light or dark theme.
 */
export const READER_THEME_COLORS: Record<
  Exclude<ReaderTheme, "system">,
  ReaderColors
> = {
  light: { background: "#ffffff", text: "#111111" },
  dark: { background: "#1c1c1e", text: "#ece9e2" },
  sepia: { background: "#f4ecd8", text: "#45351f" },
};
