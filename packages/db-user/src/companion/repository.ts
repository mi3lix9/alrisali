import {
  companionThemeSchema,
  DEFAULT_COMPANION_THEME,
  xpAward,
} from "@alrisali/domain/companion";
import type { CompanionTheme, XpEvent } from "@alrisali/domain/companion";
import { eq, sql } from "drizzle-orm";

import type { UserDb } from "../shared";
import { companion, companionXpAwards } from "./schema";

/** The single Companion row's id. */
const COMPANION_ID = "companion";

export interface Companion {
  /** Total XP, from every award including kinds a newer app added. */
  xp: number;
  theme: CompanionTheme;
}

export interface AwardResult {
  /** False when the event had already been awarded (here or on a synced device). */
  awarded: boolean;
  /** Total XP without this award, and with it. */
  before: number;
  after: number;
}

export interface CompanionRepository {
  /** Awards the event's XP once; hearing it again awards nothing. */
  award: (event: XpEvent) => Promise<AwardResult>;
  companion: () => Promise<Companion>;
  setTheme: (theme: CompanionTheme) => Promise<void>;
}

export const createCompanionRepository = (
  db: UserDb,
  now: () => Date = () => new Date()
): CompanionRepository => {
  const totalXp = async (): Promise<number> => {
    const row = await db
      .select({ xp: sql<number>`coalesce(sum(${companionXpAwards.xp}), 0)` })
      .from(companionXpAwards)
      .get();
    return Number(row?.xp ?? 0);
  };

  const award = async (event: XpEvent): Promise<AwardResult> => {
    const { key, kind, xp } = xpAward(event);
    // The key is the primary key, so a repeat inserts nothing and returns no row.
    const inserted = await db
      .insert(companionXpAwards)
      .values({ id: key, kind, xp, awardedAt: now() })
      .onConflictDoNothing({ target: companionXpAwards.id })
      .returning({ id: companionXpAwards.id });
    const after = await totalXp();
    const awarded = inserted.length > 0;
    return { awarded, before: awarded ? after - xp : after, after };
  };

  const read = async (): Promise<Companion> => {
    const row = await db
      .select({ theme: companion.theme })
      .from(companion)
      .where(eq(companion.id, COMPANION_ID))
      .get();
    // A newer app may have synced a theme this one cannot show.
    const theme = companionThemeSchema.safeParse(row?.theme);
    return {
      xp: await totalXp(),
      theme: theme.success ? theme.data : DEFAULT_COMPANION_THEME,
    };
  };

  const setTheme = async (theme: CompanionTheme): Promise<void> => {
    const parsed = companionThemeSchema.parse(theme);
    await db
      .insert(companion)
      .values({ id: COMPANION_ID, theme: parsed })
      .onConflictDoUpdate({ target: companion.id, set: { theme: parsed } });
  };

  return { award, companion: read, setTheme };
};
