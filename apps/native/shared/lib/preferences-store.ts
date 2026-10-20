import type {
  ShellPreferences,
  ShellPreferencesChange,
  ShellPreferencesRepository,
} from "@alrisali/db-user/shared";
import {
  DEFAULT_DIGITS,
  DEFAULT_HIDDEN_TABS,
  DEFAULT_SHORTCUT_LAYOUT,
  DEFAULT_TEXT_SIZE,
  DEFAULT_THEME_PREFERENCE,
  FEATURES,
  moveShortcut,
  setShortcutShown,
  setTabVisible,
} from "@alrisali/domain/shared";
import type {
  Digits,
  FeatureId,
  ShortcutLayout,
  Tab,
  TextSize,
  ThemePreference,
} from "@alrisali/domain/shared";
import { DEFAULT_LANGUAGE } from "@alrisali/i18n";
import type { Language } from "@alrisali/i18n";
import type { StateCreator } from "zustand";

// The shell preferences (language, theme, text size, hidden tabs, digits,
// Home shortcuts) belong to the Believer's database, so they follow the
// Believer to a new phone. The shell needs them before its first frame, and
// the database opens asynchronously, so the device keeps a startup cache: the
// store starts from it, then hydrates from the database (the database wins)
// and writes every change through to both.

export interface Preferences {
  language: Language;
  theme: ThemePreference;
  textSize: TextSize;
  hiddenTabs: readonly Tab[];
  digits: Digits;
  homeShortcuts: ShortcutLayout<FeatureId>;
}

/** What the startup cache holds; null where nothing was chosen. */
export type CachedPreferences = {
  [Key in keyof Preferences]: Preferences[Key] | null;
};

export interface PreferencesCache {
  /** Read synchronously, for the first frame. */
  read: () => CachedPreferences;
  write: (preferences: CachedPreferences) => void;
}

export interface PreferencesStoreOptions {
  cache: PreferencesCache;
  /** The Believer's database as it is now: sign-in and sign-out swap it. */
  repository: () => Promise<ShellPreferencesRepository>;
  applyTheme: (theme: ThemePreference) => void;
  applyTextSize: (textSize: TextSize) => void;
  /** A failed database read or write; the cache keeps the preferences. */
  onError: (error: unknown) => void;
}

export interface PreferencesState extends Preferences {
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
  setTextSize: (textSize: TextSize) => void;
  setTabVisible: (tab: Tab, visible: boolean) => void;
  setDigits: (digits: Digits) => void;
  /** Shows or hides a Home shortcut. */
  setShortcutShown: (id: FeatureId, shown: boolean) => void;
  /** Moves a Home shortcut, by its place in `arrangedShortcuts`. */
  moveShortcut: (from: number, to: number) => void;
  /**
   * Reads the Believer's database over the cached preferences, and saves into
   * it what only the cache knows (preferences chosen before this table
   * existed, or on this device as a Guest before a sign-out wiped it).
   * Resolves after every change made before it was written through.
   */
  hydrate: () => Promise<void>;
}

const withDefaults = (chosen: CachedPreferences): Preferences => ({
  language: chosen.language ?? DEFAULT_LANGUAGE,
  theme: chosen.theme ?? DEFAULT_THEME_PREFERENCE,
  textSize: chosen.textSize ?? DEFAULT_TEXT_SIZE,
  hiddenTabs: chosen.hiddenTabs ?? DEFAULT_HIDDEN_TABS,
  digits: chosen.digits ?? DEFAULT_DIGITS,
  homeShortcuts: chosen.homeShortcuts ?? DEFAULT_SHORTCUT_LAYOUT,
});

export const createPreferences =
  ({
    cache,
    repository,
    applyTheme,
    applyTextSize,
    onError,
  }: PreferencesStoreOptions): StateCreator<PreferencesState> =>
  (set, get) => {
    // Database work runs one at a time, in the order it was asked for, so a
    // hydration never reads around a change still being written.
    let queue: Promise<void> = Promise.resolve();
    const enqueue = (work: () => Promise<void>): Promise<void> => {
      const previous = queue;
      queue = (async () => {
        await previous;
        try {
          await work();
        } catch (error) {
          onError(error);
        }
      })();
      return queue;
    };

    // Counts changes, so a hydration can tell one was made after it was
    // asked for: that change's write is queued behind it, and must not be
    // undone by the value the hydration read.
    let changes = 0;

    const change = (patch: Partial<Preferences>): void => {
      changes += 1;
      set(patch);
      cache.write({ ...cache.read(), ...patch });
      void enqueue(async () => {
        const preferences = await repository();
        await preferences.update(patch);
      });
    };

    const hydrate = (): Promise<void> => {
      const changesBefore = changes;
      return enqueue(async () => {
        const preferences = await repository();
        const saved = await preferences.get();
        const cached = cache.read();
        const keys = Object.keys(saved) as (keyof ShellPreferences)[];
        const chosen = Object.fromEntries(
          keys.map((key) => [key, saved[key] ?? cached[key] ?? null])
        ) as CachedPreferences;
        // What only the cache knows goes into the database.
        const unsaved = Object.fromEntries(
          keys
            .filter((key) => saved[key] === null && cached[key] !== null)
            .map((key) => [key, cached[key]])
        ) as ShellPreferencesChange;
        if (Object.keys(unsaved).length > 0) {
          await preferences.update(unsaved);
        }
        if (changes !== changesBefore) {
          return;
        }
        cache.write(chosen);
        const next = withDefaults(chosen);
        const current = get();
        if (next.theme !== current.theme) {
          applyTheme(next.theme);
        }
        if (next.textSize !== current.textSize) {
          applyTextSize(next.textSize);
        }
        set(next);
      });
    };

    const initial = withDefaults(cache.read());
    applyTheme(initial.theme);
    applyTextSize(initial.textSize);

    return {
      ...initial,
      setLanguage: (language) => change({ language }),
      setTheme: (theme) => {
        applyTheme(theme);
        change({ theme });
      },
      setTextSize: (textSize) => {
        applyTextSize(textSize);
        change({ textSize });
      },
      setTabVisible: (tab, visible) =>
        change({ hiddenTabs: setTabVisible(get().hiddenTabs, tab, visible) }),
      setDigits: (digits) => change({ digits }),
      setShortcutShown: (id, shown) =>
        change({
          homeShortcuts: setShortcutShown(
            FEATURES,
            get().homeShortcuts,
            id,
            shown
          ),
        }),
      moveShortcut: (from, to) =>
        change({
          homeShortcuts: moveShortcut(FEATURES, get().homeShortcuts, from, to),
        }),
      hydrate,
    };
  };
