import * as SecureStore from "expo-secure-store";
import { z } from "zod";
import { create } from "zustand";

// How the Supplication reader shows a text, kept on the device like the
// shell's own preferences: they are display settings, not the Believer's
// records.

const STORAGE_KEY = "alrisali.reader";

export const READER_LANGUAGES = ["ar", "en", "both"] as const;

export type ReaderLanguage = (typeof READER_LANGUAGES)[number];

export const FONT_SIZE = { min: 16, max: 40, step: 2 } as const;

interface ReaderPreferences {
  language: ReaderLanguage;
  fontSize: number;
}

const DEFAULTS: ReaderPreferences = { language: "both", fontSize: 24 };

const storedSchema = z
  .object({
    language: z.enum(READER_LANGUAGES),
    fontSize: z.number().int().min(FONT_SIZE.min).max(FONT_SIZE.max),
  })
  .partial();

const readStored = (): ReaderPreferences => {
  const raw = SecureStore.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULTS;
  }
  try {
    const { data } = storedSchema.safeParse(JSON.parse(raw));
    return {
      language: data?.language ?? DEFAULTS.language,
      fontSize: data?.fontSize ?? DEFAULTS.fontSize,
    };
  } catch {
    return DEFAULTS;
  }
};

interface ReaderPreferencesState extends ReaderPreferences {
  setLanguage: (language: ReaderLanguage) => void;
  /** Steps the font size up (+1) or down (-1), within its bounds. */
  stepFontSize: (direction: 1 | -1) => void;
}

export const useReaderPreferences = create<ReaderPreferencesState>()((
  set,
  get
) => {
  const persist = (patch: Partial<ReaderPreferences>) => {
    const { language, fontSize } = { ...get(), ...patch };
    SecureStore.setItem(STORAGE_KEY, JSON.stringify({ language, fontSize }));
    set(patch);
  };

  return {
    ...readStored(),
    setLanguage: (language) => persist({ language }),
    stepFontSize: (direction) =>
      persist({
        fontSize: Math.min(
          FONT_SIZE.max,
          Math.max(FONT_SIZE.min, get().fontSize + direction * FONT_SIZE.step)
        ),
      }),
  };
});
