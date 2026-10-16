import { PAGE_PALETTE_COLORS } from "@alrisali/domain/quran";
import type { PagePalette, PagePaletteColors } from "@alrisali/domain/quran";
import { createContext, use } from "react";
import type { ReactNode } from "react";

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
}) => (
  <PageColorsContext value={PAGE_PALETTE_COLORS[palette]}>
    {children}
  </PageColorsContext>
);

/** The page's own colours: they follow the chosen palette, not the app theme. */
export const usePageColors = (): PagePaletteColors => use(PageColorsContext);
