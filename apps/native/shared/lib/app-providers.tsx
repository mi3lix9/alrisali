import { QueryClientProvider } from "@tanstack/react-query";
import {
  DarkTheme,
  DefaultTheme,
  LocaleDirContext,
  ThemeProvider,
} from "expo-router/react-navigation";
import type { Theme } from "expo-router/react-navigation";
import { Direction, PanelUIProvider } from "panelui-native";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { LayoutDirection, useCSSVariable, useUniwind } from "uniwind";

import { useContentSync } from "./content-database";
import { i18n, launchDirection } from "./i18n";
import { queryClient } from "./orpc";
import { useUserDataSync } from "./user-database";

const PANEL_COLORS = [
  "--color-primary",
  "--color-background",
  "--color-card",
  "--color-foreground",
  "--color-border",
  "--color-destructive",
] as const;

const asColor = <Fallback,>(
  value: string | number | undefined,
  fallback: Fallback
): string | Fallback => (typeof value === "string" ? value : fallback);

/** Native stack headers painted from the active Panel UI theme. */
const useNavigationTheme = (): Theme => {
  const { theme } = useUniwind();
  const [primary, background, card, text, border, notification] =
    useCSSVariable([...PANEL_COLORS]);

  return useMemo(() => {
    const base = theme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        primary: asColor(primary, base.colors.primary),
        background: asColor(background, base.colors.background),
        card: asColor(card, base.colors.card),
        text: asColor(text, base.colors.text),
        border: asColor(border, base.colors.border),
        notification: asColor(notification, base.colors.notification),
      },
    };
  }, [theme, primary, background, card, text, border, notification]);
};

const NavigationTheme = ({ children }: { children: ReactNode }) => (
  <ThemeProvider value={useNavigationTheme()}>{children}</ThemeProvider>
);

const DataSync = () => {
  useUserDataSync();
  useContentSync();
  return null;
};

/**
 * Everything the screens stand on. The direction comes from the launch
 * language, not from the native flag: expo-localization's `forcesRTL` makes
 * every launch right-to-left, and an English launch turns it back here for
 * Yoga (`Direction`), Uniwind's `rtl:` variants, Panel UI and the native
 * stack headers alike. The native tab bar takes it as a prop (see the tabs
 * layout).
 */
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <LayoutDirection rtl={launchDirection === "rtl"}>
        <Direction dir={launchDirection} className="flex-1">
          <PanelUIProvider>
            <LocaleDirContext.Provider value={launchDirection}>
              <DataSync />
              <NavigationTheme>{children}</NavigationTheme>
            </LocaleDirContext.Provider>
          </PanelUIProvider>
        </Direction>
      </LayoutDirection>
    </QueryClientProvider>
  </I18nextProvider>
);
