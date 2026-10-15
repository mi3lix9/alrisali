import {
  DEFAULT_HIDDEN_TABS,
  DEFAULT_TEXT_SIZE,
  readHiddenTabs,
  setTabVisible,
  TEXT_SCALE,
  TEXT_SIZES,
} from "@alrisali/domain/shared";
import type { Tab, TextSize } from "@alrisali/domain/shared";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@alrisali/i18n";
import type { Language } from "@alrisali/i18n";
import * as SecureStore from "expo-secure-store";
import { Uniwind } from "uniwind";
import { z } from "zod";
import { create } from "zustand";

import { deviceEntry } from "./device-entries";

// Device preferences the shell needs before its first frame: the language
// (and with it the layout direction), the theme, the text size and the
// hidden tabs. They are read synchronously at startup, so they live in a
// small key-value entry rather than in the Believer's database, which opens
// asynchronously.
//
// The text size and hidden tabs are Believer settings that should follow the
// Believer to a new phone: once the per-user database is in place they belong
// in its settings, with this entry kept as the startup cache.

const STORAGE_KEY = deviceEntry("alrisali.preferences");

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

interface Preferences {
  language: Language;
  theme: ThemePreference;
  textSize: TextSize;
  hiddenTabs: readonly Tab[];
}

const DEFAULTS: Preferences = {
  language: DEFAULT_LANGUAGE,
  theme: "system",
  textSize: DEFAULT_TEXT_SIZE,
  hiddenTabs: DEFAULT_HIDDEN_TABS,
};

const storedSchema = z
  .object({
    language: z.enum(LANGUAGES),
    theme: z.enum(THEME_PREFERENCES),
    textSize: z.enum(TEXT_SIZES),
    hiddenTabs: z.unknown(),
  })
  .partial();

const readStored = (): Preferences => {
  const raw = SecureStore.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULTS;
  }
  try {
    const { data } = storedSchema.safeParse(JSON.parse(raw));
    return {
      language: data?.language ?? DEFAULTS.language,
      theme: data?.theme ?? DEFAULTS.theme,
      textSize: data?.textSize ?? DEFAULTS.textSize,
      hiddenTabs: readHiddenTabs(data?.hiddenTabs),
    };
  } catch {
    return DEFAULTS;
  }
};

// Tailwind's type scale in points. Panel UI and the app size text with these
// utilities (`text-sm`, `text-lg`, …), which Uniwind resolves from the
// `--text-*` variables at runtime, so scaling the variables scales every
// screen at once.
const TYPE_SCALE = {
  "--text-xs": 12,
  "--text-sm": 14,
  "--text-base": 16,
  "--text-lg": 18,
  "--text-xl": 20,
  "--text-2xl": 24,
  "--text-3xl": 30,
  "--text-4xl": 36,
  "--text-5xl": 48,
} as const;

const applyTextSize = (textSize: TextSize) => {
  const scale = TEXT_SCALE[textSize];
  const variables = Object.fromEntries(
    Object.entries(TYPE_SCALE).map(([name, points]) => [
      name,
      Math.round(points * scale),
    ])
  );
  for (const theme of Uniwind.themes) {
    Uniwind.updateCSSVariables(theme, variables);
  }
};

const stored = readStored();

/**
 * The language this launch runs in. A language change is stored at once but
 * applies on the next launch, when the whole shell (native tab bar included)
 * is laid out again in the new direction.
 */
export const launchLanguage: Language = stored.language;

Uniwind.setTheme(stored.theme);
applyTextSize(stored.textSize);

interface PreferencesState extends Preferences {
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
  setTextSize: (textSize: TextSize) => void;
  setTabVisible: (tab: Tab, visible: boolean) => void;
}

export const usePreferences = create<PreferencesState>()((set, get) => {
  const persist = (patch: Partial<Preferences>) => {
    const { language, theme, textSize, hiddenTabs } = { ...get(), ...patch };
    SecureStore.setItem(
      STORAGE_KEY,
      JSON.stringify({ language, theme, textSize, hiddenTabs })
    );
    set(patch);
  };

  return {
    ...stored,
    setLanguage: (language) => persist({ language }),
    setTheme: (theme) => {
      Uniwind.setTheme(theme);
      persist({ theme });
    },
    setTextSize: (textSize) => {
      applyTextSize(textSize);
      persist({ textSize });
    },
    setTabVisible: (tab, visible) =>
      persist({ hiddenTabs: setTabVisible(get().hiddenTabs, tab, visible) }),
  };
});
