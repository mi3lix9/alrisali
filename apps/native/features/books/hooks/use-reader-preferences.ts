import {
  DEFAULT_READER_FORMAT,
  readReaderFormat,
  stepReaderFontSize,
} from "@alrisali/domain/books";
import type { ReaderFormat } from "@alrisali/domain/books";
import * as SecureStore from "expo-secure-store";
import { z } from "zod";
import { create } from "zustand";

import { deviceEntry } from "@/shared/lib/device-entries";

// How the Supplication reader shows a text, kept on the device like the
// shell's own preferences: they are display settings, not the Believer's
// records.

const STORAGE_KEY = deviceEntry("alrisali.reader");

export const READER_LANGUAGES = ["ar", "en", "both"] as const;

export type ReaderLanguage = (typeof READER_LANGUAGES)[number];

interface ReaderPreferences extends ReaderFormat {
  language: ReaderLanguage;
}

const DEFAULT_LANGUAGE: ReaderLanguage = "both";

const languageSchema = z.enum(READER_LANGUAGES);

const readStored = (): ReaderPreferences => {
  const raw = SecureStore.getItem(STORAGE_KEY);
  let stored: unknown = null;
  try {
    stored = raw ? JSON.parse(raw) : null;
  } catch {
    stored = null;
  }
  const language = languageSchema.safeParse(
    (stored as { language?: unknown } | null)?.language
  );
  return {
    language: language.success ? language.data : DEFAULT_LANGUAGE,
    ...readReaderFormat(stored),
  };
};

interface ReaderPreferencesState extends ReaderPreferences {
  setLanguage: (language: ReaderLanguage) => void;
  /** Applies a format choice at once, to the reader and the sample. */
  setFormat: (change: Partial<ReaderFormat>) => void;
  /** Steps the font size up (+1) or down (-1), within its bounds. */
  stepFontSize: (direction: 1 | -1) => void;
  /** Returns font, size, spacing and theme to their defaults. */
  resetFormat: () => void;
}

export const useReaderPreferences = create<ReaderPreferencesState>()((
  set,
  get
) => {
  const persist = (patch: Partial<ReaderPreferences>) => {
    const { language, font, fontSize, spacing, theme } = {
      ...get(),
      ...patch,
    };
    SecureStore.setItem(
      STORAGE_KEY,
      JSON.stringify({ language, font, fontSize, spacing, theme })
    );
    set(patch);
  };

  return {
    ...readStored(),
    setLanguage: (language) => persist({ language }),
    setFormat: (change) => persist(change),
    stepFontSize: (direction) =>
      persist({ fontSize: stepReaderFontSize(get().fontSize, direction) }),
    resetFormat: () => persist(DEFAULT_READER_FORMAT),
  };
});
