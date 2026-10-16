import { createShellPreferencesRepository } from "@alrisali/db-user/shared";
import {
  DIGITS,
  readHiddenTabs,
  TEXT_SCALE,
  TEXT_SIZES,
  THEME_PREFERENCES,
} from "@alrisali/domain/shared";
import type { TextSize } from "@alrisali/domain/shared";
import { LANGUAGES } from "@alrisali/i18n";
import type { Language } from "@alrisali/i18n";
import { captureException } from "@sentry/react-native";
import * as SecureStore from "expo-secure-store";
import { Platform, Settings } from "react-native";
import { Uniwind } from "uniwind";
import { z } from "zod";
import { create } from "zustand";

import { deviceEntry } from "./device-entries";
import { events } from "./events";
import { createPreferences } from "./preferences-store";
import type { CachedPreferences, PreferencesCache } from "./preferences-store";
import { getUserDatabase } from "./user-database";

// The shell preferences live in the Believer's database
// (`shell_preferences`); this SecureStore entry is their startup cache, read
// synchronously before the first frame. See preferences-store.ts.

const STORAGE_KEY = deviceEntry("alrisali.preferences");

const NOTHING_CACHED: CachedPreferences = {
  language: null,
  theme: null,
  textSize: null,
  hiddenTabs: null,
  digits: null,
};

const cachedSchema = z
  .object({
    language: z.enum(LANGUAGES).nullable(),
    theme: z.enum(THEME_PREFERENCES).nullable(),
    textSize: z.enum(TEXT_SIZES).nullable(),
    hiddenTabs: z.unknown(),
    digits: z.enum(DIGITS).nullable(),
  })
  .partial();

const secureStoreCache: PreferencesCache = {
  read: () => {
    const raw = SecureStore.getItem(STORAGE_KEY);
    if (!raw) {
      return NOTHING_CACHED;
    }
    try {
      const { data } = cachedSchema.safeParse(JSON.parse(raw));
      return {
        language: data?.language ?? null,
        theme: data?.theme ?? null,
        textSize: data?.textSize ?? null,
        hiddenTabs: Array.isArray(data?.hiddenTabs)
          ? readHiddenTabs(data.hiddenTabs)
          : null,
        digits: data?.digits ?? null,
      };
    } catch {
      return NOTHING_CACHED;
    }
  },
  write: (preferences) =>
    SecureStore.setItem(STORAGE_KEY, JSON.stringify(preferences)),
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

export const usePreferences = create(
  createPreferences({
    cache: secureStoreCache,
    repository: async () => {
      const { db } = await getUserDatabase();
      return createShellPreferencesRepository(db);
    },
    applyTheme: (theme) => Uniwind.setTheme(theme),
    applyTextSize,
    onError: captureException,
  })
);

/**
 * The language this launch runs in. A language change (by the Believer, or
 * from their database) is stored at once but applies on the next launch,
 * when the whole shell (native tab bar included) is laid out again in the
 * new direction.
 */
export const launchLanguage: Language = usePreferences.getState().language;

// UIKit writes its own strings (the back button's VoiceOver label "Back", the
// Sign in with Apple button) in the app's iOS language, which is the
// device's unless the app names one. The Believer's language is named here,
// and UIKit reads it at the next launch, as the shell's direction is.
const nameAppleLanguage = (language: Language) => {
  if (Platform.OS === "ios") {
    Settings.set({ AppleLanguages: [language] });
  }
};
nameAppleLanguage(launchLanguage);
usePreferences.subscribe((state, previous) => {
  if (state.language !== previous.language) {
    nameAppleLanguage(state.language);
  }
});

// Hydrates when the database opens at launch, after every sync, and after
// sign-in or sign-out swap it.
events.on("UserDatabaseChanged", () => {
  void usePreferences.getState().hydrate();
});
