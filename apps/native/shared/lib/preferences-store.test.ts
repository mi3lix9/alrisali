import type {
  ShellPreferences,
  ShellPreferencesChange,
  ShellPreferencesRepository,
} from "@alrisali/db-user/shared";
import { describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";

import { createPreferences } from "./preferences-store";
import type {
  CachedPreferences,
  PreferencesCache,
  PreferencesStoreOptions,
} from "./preferences-store";

const NOTHING = {
  language: null,
  theme: null,
  textSize: null,
  hiddenTabs: null,
  digits: null,
  homeShortcuts: null,
};

/** The SecureStore entry, in memory. */
const fakeCache = (initial: Partial<CachedPreferences> = {}) => {
  let entry: CachedPreferences = { ...NOTHING, ...initial };
  const cache: PreferencesCache = {
    read: () => entry,
    write: (next) => {
      entry = next;
    },
  };
  return { cache, entry: () => entry };
};

/** The shell_preferences row, in memory, with the repository's merge rule. */
const fakeDatabase = (initial: Partial<ShellPreferences> = {}) => {
  let row: ShellPreferences = { ...NOTHING, ...initial };
  const repository: ShellPreferencesRepository = {
    get: () => Promise.resolve(row),
    update: (change: ShellPreferencesChange) => {
      row = {
        language: change.language ?? row.language,
        theme: change.theme ?? row.theme,
        textSize: change.textSize ?? row.textSize,
        hiddenTabs: change.hiddenTabs ? [...change.hiddenTabs] : row.hiddenTabs,
        digits: change.digits ?? row.digits,
        homeShortcuts: change.homeShortcuts ?? row.homeShortcuts,
      };
      return Promise.resolve(row);
    },
  };
  return { repository, row: () => row };
};

const setup = ({
  cached = {},
  saved = {},
}: {
  cached?: Partial<CachedPreferences>;
  saved?: Partial<ShellPreferences>;
} = {}) => {
  const cache = fakeCache(cached);
  let database = fakeDatabase(saved);
  const applyTheme = vi.fn<PreferencesStoreOptions["applyTheme"]>();
  const applyTextSize = vi.fn<PreferencesStoreOptions["applyTextSize"]>();
  const onError = vi.fn<PreferencesStoreOptions["onError"]>();
  const store = createStore(
    createPreferences({
      cache: cache.cache,
      repository: () => Promise.resolve(database.repository),
      applyTheme,
      applyTextSize,
      onError,
    })
  );
  return {
    store,
    cache,
    database: () => database,
    /** Swaps the Believer's database, as sign-in and sign-out do. */
    swapDatabase: (next: Partial<ShellPreferences>) => {
      database = fakeDatabase(next);
    },
    applyTheme,
    applyTextSize,
    onError,
  };
};

describe(createPreferences, () => {
  it("starts from the cache for the first frame, before the database is read", () => {
    const { store, applyTheme, applyTextSize } = setup({
      cached: { language: "en", theme: "dark", textSize: "large" },
    });

    expect(store.getState()).toMatchObject({
      language: "en",
      theme: "dark",
      textSize: "large",
      hiddenTabs: [],
    });
    expect(applyTheme).toHaveBeenCalledWith("dark");
    expect(applyTextSize).toHaveBeenCalledWith("large");
  });

  it("starts from the defaults with nothing cached", () => {
    const { store } = setup();

    expect(store.getState()).toMatchObject({
      language: "ar",
      theme: "system",
      textSize: "default",
      hiddenTabs: [],
      digits: "arabic-indic",
    });
  });

  it("lets the database win over the cache, and caches what it read", async () => {
    const { store, cache, applyTheme, applyTextSize } = setup({
      cached: { language: "ar", theme: "light", textSize: "small" },
      saved: {
        language: "en",
        theme: "dark",
        textSize: "larger",
        hiddenTabs: ["library"],
        digits: "latin",
        homeShortcuts: { order: ["qibla"], hidden: [] },
      },
    });

    await store.getState().hydrate();

    const chosen = {
      language: "en",
      theme: "dark",
      textSize: "larger",
      hiddenTabs: ["library"],
      digits: "latin",
      homeShortcuts: { order: ["qibla"], hidden: [] },
    };
    expect(store.getState()).toMatchObject(chosen);
    expect(cache.entry()).toStrictEqual(chosen);
    expect(applyTheme).toHaveBeenLastCalledWith("dark");
    expect(applyTextSize).toHaveBeenLastCalledWith("larger");
  });

  it("saves what only the cache knows into the database", async () => {
    const { store, database } = setup({
      cached: { language: "en", theme: "dark", digits: "latin" },
      saved: { theme: "light" },
    });

    await store.getState().hydrate();

    expect(store.getState()).toMatchObject({
      language: "en",
      theme: "light",
      textSize: "default",
      digits: "latin",
    });
    expect(database().row()).toStrictEqual({
      language: "en",
      theme: "light",
      textSize: null,
      hiddenTabs: null,
      digits: "latin",
      homeShortcuts: null,
    });
  });

  it("writes every change through to the cache and the database", async () => {
    const { store, cache, database, applyTheme, applyTextSize } = setup();
    await store.getState().hydrate();

    store.getState().setLanguage("en");
    store.getState().setTheme("dark");
    store.getState().setTextSize("large");
    store.getState().setTabVisible("tasbih", false);
    store.getState().setDigits("latin");
    store.getState().setShortcutShown("lessons", true);
    // Writes queue behind each other; a hydration runs after them.
    await store.getState().hydrate();

    const chosen = {
      language: "en",
      theme: "dark",
      textSize: "large",
      hiddenTabs: ["tasbih"],
      digits: "latin",
      homeShortcuts: {
        order: [
          "quran",
          "prayer",
          "qibla",
          "prayer-assistant",
          "library",
          "lessons",
          "worship",
          "programs",
          "tasbih",
          "calendar",
          "gatherings",
          "insights",
          "khatmah",
        ],
        hidden: ["library", "worship", "programs", "gatherings", "khatmah"],
      },
    };
    expect(store.getState()).toMatchObject(chosen);
    expect(cache.entry()).toStrictEqual(chosen);
    expect(database().row()).toStrictEqual(chosen);
    expect(applyTheme).toHaveBeenLastCalledWith("dark");
    expect(applyTextSize).toHaveBeenLastCalledWith("large");
  });

  it("moves a Home shortcut and keeps it where it was dropped", async () => {
    const { store, database } = setup();

    store.getState().moveShortcut(8, 0);
    await store.getState().hydrate();

    expect(store.getState().homeShortcuts.order.slice(0, 2)).toStrictEqual([
      "tasbih",
      "quran",
    ]);
    expect(database().row().homeShortcuts?.order[0]).toBe("tasbih");
  });

  it("keeps a change made while the database is being read", async () => {
    const { store, database } = setup({ saved: { theme: "light" } });

    const hydrating = store.getState().hydrate();
    store.getState().setTheme("dark");
    await hydrating;
    await store.getState().hydrate();

    expect(store.getState().theme).toBe("dark");
    expect(database().row().theme).toBe("dark");
  });

  it("hydrates again from the database it swaps to", async () => {
    const { store, swapDatabase } = setup({
      cached: { theme: "dark" },
      saved: { theme: "dark" },
    });
    await store.getState().hydrate();

    swapDatabase({ theme: "light", hiddenTabs: ["prayer"] });
    await store.getState().hydrate();

    expect(store.getState()).toMatchObject({
      theme: "light",
      hiddenTabs: ["prayer"],
    });
  });

  it("keeps the device's preferences in a fresh Guest database", async () => {
    const homeShortcuts = { order: ["qibla" as const], hidden: [] };
    const { store, database, swapDatabase } = setup({
      saved: { language: "en", textSize: "large", homeShortcuts },
    });
    await store.getState().hydrate();

    // Sign-out wipes the database; the next one is an empty Guest database.
    swapDatabase({});
    await store.getState().hydrate();

    expect(store.getState()).toMatchObject({
      language: "en",
      textSize: "large",
      homeShortcuts,
    });
    expect(database().row()).toMatchObject({
      language: "en",
      textSize: "large",
      homeShortcuts,
    });
  });

  it("reports a database failure and keeps the cached preferences", async () => {
    const error = new Error("database unavailable");
    const cache = fakeCache({ theme: "dark" });
    const onError = vi.fn<PreferencesStoreOptions["onError"]>();
    const store = createStore(
      createPreferences({
        cache: cache.cache,
        repository: () => Promise.reject(error),
        applyTheme: vi.fn<PreferencesStoreOptions["applyTheme"]>(),
        applyTextSize: vi.fn<PreferencesStoreOptions["applyTextSize"]>(),
        onError,
      })
    );

    await store.getState().hydrate();
    store.getState().setTextSize("small");
    await store.getState().hydrate();

    expect(onError).toHaveBeenCalledWith(error);
    expect(store.getState()).toMatchObject({
      theme: "dark",
      textSize: "small",
    });
    expect(cache.entry()).toMatchObject({ theme: "dark", textSize: "small" });
  });
});
