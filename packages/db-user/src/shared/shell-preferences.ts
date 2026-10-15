import {
  readHiddenTabs,
  TEXT_SIZES,
  TABS,
  themePreferenceSchema,
} from "@alrisali/domain/shared";
import type { Tab, TextSize, ThemePreference } from "@alrisali/domain/shared";
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
}

/** The preferences to change; anything left out keeps its saved value. */
export interface ShellPreferencesChange {
  language?: Language;
  theme?: ThemePreference;
  textSize?: TextSize;
  hiddenTabs?: readonly Tab[];
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

const changeSchema = z.object({
  language: languageSchema.optional(),
  theme: themePreferenceSchema.optional(),
  textSize: textSizeSchema.optional(),
  hiddenTabs: z.array(z.enum(TABS)).optional(),
});

type Row = typeof shellPreferences.$inferSelect;

/** A stored value if this app knows it; a newer app may have synced others. */
const known = <T>(schema: z.ZodType<T>, stored: unknown): T | null => {
  const parsed = schema.safeParse(stored);
  return parsed.success ? parsed.data : null;
};

const readStoredTabs = (stored: string | null | undefined): Tab[] | null => {
  if (stored === null || stored === undefined) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? readHiddenTabs(parsed) : null;
  } catch {
    return null;
  }
};

const toPreferences = (row: Row | undefined): ShellPreferences => ({
  language: known(languageSchema, row?.language),
  theme: known(themePreferenceSchema, row?.theme),
  textSize: known(textSizeSchema, row?.textSize),
  hiddenTabs: readStoredTabs(row?.hiddenTabs),
});

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
    };
    const columns = {
      language: next.language,
      theme: next.theme,
      textSize: next.textSize,
      hiddenTabs:
        next.hiddenTabs === null ? null : JSON.stringify(next.hiddenTabs),
    };
    await db
      .insert(shellPreferences)
      .values({ id: ROW_ID, ...columns })
      .onConflictDoUpdate({ target: shellPreferences.id, set: columns });
    return next;
  };

  return { get, update };
};
