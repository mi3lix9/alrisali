import {
  digitsSchema,
  FEATURES,
  readHiddenTabs,
  readShortcutLayout,
  TEXT_SIZES,
  TABS,
  themePreferenceSchema,
} from "@alrisali/domain/shared";
import type {
  Digits,
  FeatureId,
  ShortcutLayout,
  Tab,
  TextSize,
  ThemePreference,
} from "@alrisali/domain/shared";
import { LANGUAGES } from "@alrisali/i18n";
import type { Language } from "@alrisali/i18n";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { shellPreferences } from "./schema";
import type { UserDb } from "./user-database";

/**
 * The Believer's shell preferences, each null until chosen on some device:
 * the device then keeps what it has (its startup cache or the defaults).
 */
export interface ShellPreferences {
  language: Language | null;
  theme: ThemePreference | null;
  textSize: TextSize | null;
  hiddenTabs: Tab[] | null;
  digits: Digits | null;
  homeShortcuts: ShortcutLayout<FeatureId> | null;
}

/** The preferences to change; anything left out keeps its saved value. */
export interface ShellPreferencesChange {
  language?: Language;
  theme?: ThemePreference;
  textSize?: TextSize;
  hiddenTabs?: readonly Tab[];
  digits?: Digits;
  homeShortcuts?: ShortcutLayout<FeatureId>;
}

export interface ShellPreferencesRepository {
  get: () => Promise<ShellPreferences>;
  /** Validates and saves the change, then returns the saved preferences. */
  update: (change: ShellPreferencesChange) => Promise<ShellPreferences>;
}

/** The table holds one row, with a stable id so sync merges it. */
const ROW_ID = "believer";

const languageSchema = z.enum(LANGUAGES);
const textSizeSchema = z.enum(TEXT_SIZES);
const featureIdSchema = z.enum(FEATURES.map((feature) => feature.id));

const changeSchema = z.object({
  language: languageSchema.optional(),
  theme: themePreferenceSchema.optional(),
  textSize: textSizeSchema.optional(),
  hiddenTabs: z.array(z.enum(TABS)).optional(),
  digits: digitsSchema.optional(),
  homeShortcuts: z
    .object({
      order: z.array(featureIdSchema),
      hidden: z.array(featureIdSchema),
    })
    .optional(),
});

type Row = typeof shellPreferences.$inferSelect;

/** A stored value if this app knows it; a newer app may have synced others. */
const known = <T>(schema: z.ZodType<T>, stored: unknown): T | null => {
  const parsed = schema.safeParse(stored);
  return parsed.success ? parsed.data : null;
};

/** A JSON column's value, or null if it holds none (or not JSON). */
const readJson = (stored: string | null | undefined): unknown => {
  if (stored === null || stored === undefined) {
    return null;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const toPreferences = (row: Row | undefined): ShellPreferences => {
  const hiddenTabs = readJson(row?.hiddenTabs);
  return {
    language: known(languageSchema, row?.language),
    theme: known(themePreferenceSchema, row?.theme),
    textSize: known(textSizeSchema, row?.textSize),
    hiddenTabs: Array.isArray(hiddenTabs) ? readHiddenTabs(hiddenTabs) : null,
    digits: known(digitsSchema, row?.digits),
    homeShortcuts: readShortcutLayout(FEATURES, readJson(row?.homeShortcuts)),
  };
};

export const createShellPreferencesRepository = (
  db: UserDb
): ShellPreferencesRepository => {
  const get = async (): Promise<ShellPreferences> =>
    toPreferences(
      await db
        .select()
        .from(shellPreferences)
        .where(eq(shellPreferences.id, ROW_ID))
        .get()
    );

  const update = async (
    change: ShellPreferencesChange
  ): Promise<ShellPreferences> => {
    const parsed = changeSchema.parse(change);
    const current = await get();
    const next: ShellPreferences = {
      language: parsed.language ?? current.language,
      theme: parsed.theme ?? current.theme,
      textSize: parsed.textSize ?? current.textSize,
      hiddenTabs:
        parsed.hiddenTabs === undefined
          ? current.hiddenTabs
          : readHiddenTabs(parsed.hiddenTabs),
      digits: parsed.digits ?? current.digits,
      homeShortcuts:
        parsed.homeShortcuts === undefined
          ? current.homeShortcuts
          : readShortcutLayout(FEATURES, parsed.homeShortcuts),
    };
    const columns = {
      language: next.language,
      theme: next.theme,
      textSize: next.textSize,
      hiddenTabs:
        next.hiddenTabs === null ? null : JSON.stringify(next.hiddenTabs),
      digits: next.digits,
      homeShortcuts:
        next.homeShortcuts === null ? null : JSON.stringify(next.homeShortcuts),
    };
    await db
      .insert(shellPreferences)
      .values({ id: ROW_ID, ...columns })
      .onConflictDoUpdate({ target: shellPreferences.id, set: columns });
    return next;
  };

  return { get, update };
};
