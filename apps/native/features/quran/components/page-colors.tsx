import { PAGE_PALETTE_COLORS, pagePaletteColors } from "@alrisali/domain/quran";
import type { PagePalette, PagePaletteColors } from "@alrisali/domain/quran";
import { createContext, use } from "react";
import type { ReactNode } from "react";
import { useUniwind } from "uniwind";

const PageColorsContext = createContext<PagePaletteColors>(
  PAGE_PALETTE_COLORS.white
);

/** The Believer's page colour, for everything drawn on the Quran page. */
export const PageColorsProvider = ({
  palette,
  children,
}: {
  palette: PagePalette;
  children: ReactNode;
}) => {
  // `theme` follows the app's resolved light or dark theme, live.
  const { theme } = useUniwind();
  const colors = pagePaletteColors(
    palette,
    theme === "dark" ? "dark" : "light"
  );
  return <PageColorsContext value={colors}>{children}</PageColorsContext>;
};

/** The page's own colours: they follow the chosen palette, not the app theme. */
export const usePageColors = (): PagePaletteColors => use(PageColorsContext);
