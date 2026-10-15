import { DEFAULT_LANGUAGE, LANGUAGES } from "@alrisali/i18n";
import type { Language } from "@alrisali/i18n";
import * as SecureStore from "expo-secure-store";
import { Uniwind } from "uniwind";
import { z } from "zod";
import { create } from "zustand";

// Device preferences the shell needs before its first frame: the language
// (and with it the layout direction) and the theme. They are read
// synchronously at startup, so they live in a small key-value entry rather
// than in the Believer's database, which opens asynchronously.

const STORAGE_KEY = "alrisali.preferences";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

interface Preferences {
  language: Language;
  theme: ThemePreference;
}

const DEFAULTS: Preferences = { language: DEFAULT_LANGUAGE, theme: "system" };

const storedSchema = z
  .object({
    language: z.enum(LANGUAGES),
    theme: z.enum(THEME_PREFERENCES),
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
    };
  } catch {
    return DEFAULTS;
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

interface PreferencesState extends Preferences {
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
}

export const usePreferences = create<PreferencesState>()((set, get) => {
  const persist = (patch: Partial<Preferences>) => {
    const { language, theme } = { ...get(), ...patch };
    SecureStore.setItem(STORAGE_KEY, JSON.stringify({ language, theme }));
    set(patch);
  };

  return {
    ...stored,
    setLanguage: (language) => persist({ language }),
    setTheme: (theme) => {
      Uniwind.setTheme(theme);
      persist({ theme });
    },
  };
});
