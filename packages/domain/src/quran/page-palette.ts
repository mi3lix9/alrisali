/**
 * The colours the Quran page can be read on. `theme` follows the app: white
 * in light mode, pure black in dark mode.
 */
export const PAGE_PALETTES = [
  "theme",
  "white",
  "cream",
  "soft-dark",
  "black",
] as const;
export type PagePalette = (typeof PAGE_PALETTES)[number];

/** A palette with its own colours: every one but `theme`. */
export type FixedPagePalette = Exclude<PagePalette, "theme">;

export interface PagePaletteColors {
  background: string;
  /** Ayat and surah headers. */
  text: string;
  /** Juz, surah and page bands, and the surah-header plate. */
  mutedText: string;
  /** The plate behind a surah header. */
  plate: string;
  /** Hairlines, such as the plate's border. */
  border: string;
  /** Highlight behind the ayah being pressed or opened. */
  highlight: string;
  /** The Last-Read Ayah's rosette. */
  accent: string;
  /** Whether the status bar's icons should be light on this background. */
  dark: boolean;
}

/**
 * The page sets its own colours, whatever the app theme: the Believer
 * chooses the paper, not the system.
 */
export const PAGE_PALETTE_COLORS: Record<FixedPagePalette, PagePaletteColors> =
  {
    white: {
      background: "#ffffff",
      text: "#1a1a1a",
      mutedText: "#6b6b6b",
      plate: "#f3f3f3",
      border: "#dcdcdc",
      highlight: "#e4ecf7",
      accent: "#1d6fb8",
      dark: false,
    },
    cream: {
      background: "#f6edd6",
      text: "#2b2418",
      mutedText: "#7a6c52",
      plate: "#ece0c0",
      border: "#d6c79f",
      highlight: "#e6d6a8",
      accent: "#1d6fb8",
      dark: false,
    },
    "soft-dark": {
      background: "#1f2125",
      text: "#d9d6cd",
      mutedText: "#8e8c85",
      plate: "#2a2d32",
      border: "#3a3e44",
      highlight: "#394252",
      accent: "#6cb1ee",
      dark: true,
    },
    black: {
      background: "#000000",
      text: "#f2f2f2",
      mutedText: "#9a9a9a",
      plate: "#141414",
      border: "#2a2a2a",
      highlight: "#26303d",
      accent: "#6cb1ee",
      dark: true,
    },
  };

/** The colours a palette draws with, given the app's resolved theme. */
export const pagePaletteColors = (
  palette: PagePalette,
  appTheme: "light" | "dark"
): PagePaletteColors => {
  if (palette === "theme") {
    return PAGE_PALETTE_COLORS[appTheme === "dark" ? "black" : "white"];
  }
  return PAGE_PALETTE_COLORS[palette];
};
