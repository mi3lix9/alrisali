import {
  dhikrSessionSchema,
  isTasbihAlZahra,
  restoreTasbihAlZahra,
  TASBIH_AL_ZAHRA_ID,
  TASBIH_AL_ZAHRA_START,
  TasbihAlZahraIsPermanentError,
} from "@alrisali/domain/tasbih";
import type {
  DhikrSession,
  TasbihAlZahraProgress,
} from "@alrisali/domain/tasbih";
import { asc, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import type { UserDb } from "../shared";
import { dhikrSessions, tasbih } from "./schema";

const TASBIH_AL_ZAHRA_KIND = "tasbih-al-zahra";
const OPEN_KIND = "open";

export type Tasbih =
  | {
      id: string;
      kind: typeof TASBIH_AL_ZAHRA_KIND;
      progress: TasbihAlZahraProgress;
    }
  | { id: string; kind: typeof OPEN_KIND; name: string; count: number };

export interface TasbihRepository {
  /** Every Tasbih, Tasbih al-Zahra first. It is listed even before its first tap. */
  list: () => Promise<Tasbih[]>;
  getTasbihAlZahraProgress: () => Promise<TasbihAlZahraProgress>;
  saveTasbihAlZahraProgress: (progress: TasbihAlZahraProgress) => Promise<void>;
  /** Renames an Open Tasbih; Tasbih al-Zahra cannot be renamed. */
  rename: (tasbihId: string, name: string) => Promise<void>;
  /** Deletes an Open Tasbih; Tasbih al-Zahra cannot be deleted. */
  remove: (tasbihId: string) => Promise<void>;
  /** Validates and records a Dhikr Session, then returns it. */
  recordDhikrSession: (session: DhikrSession) => Promise<DhikrSession>;
  /** Every Dhikr Session, newest first. */
  listDhikrSessions: () => Promise<DhikrSession[]>;
}

const nameSchema = z.string().trim().min(1);

export const createTasbihRepository = (db: UserDb): TasbihRepository => {
  const getTasbihAlZahraProgress = async (): Promise<TasbihAlZahraProgress> => {
    const row = await db
      .select({ step: tasbih.step, count: tasbih.count })
      .from(tasbih)
      .where(eq(tasbih.id, TASBIH_AL_ZAHRA_ID))
      .get();
    return row ? restoreTasbihAlZahra(row) : TASBIH_AL_ZAHRA_START;
  };

  const saveTasbihAlZahraProgress = async (
    progress: TasbihAlZahraProgress
  ): Promise<void> => {
    const { step, count } = restoreTasbihAlZahra(progress);
    await db
      .insert(tasbih)
      .values({
        id: TASBIH_AL_ZAHRA_ID,
        kind: TASBIH_AL_ZAHRA_KIND,
        step,
        count,
      })
      .onConflictDoUpdate({ target: tasbih.id, set: { step, count } });
  };

  const list = async (): Promise<Tasbih[]> => {
    const open = await db
      .select({ id: tasbih.id, name: tasbih.name, count: tasbih.count })
      .from(tasbih)
      .where(ne(tasbih.id, TASBIH_AL_ZAHRA_ID))
      .orderBy(asc(tasbih.name));
    return [
      {
        id: TASBIH_AL_ZAHRA_ID,
        kind: TASBIH_AL_ZAHRA_KIND,
        progress: await getTasbihAlZahraProgress(),
      },
      ...open.map((row): Tasbih => ({
        id: row.id,
        kind: OPEN_KIND,
        name: row.name ?? "",
        count: row.count,
      })),
    ];
  };

  const rename = async (tasbihId: string, name: string): Promise<void> => {
    if (isTasbihAlZahra(tasbihId)) {
      throw new TasbihAlZahraIsPermanentError("rename");
    }
    await db
      .update(tasbih)
      .set({ name: nameSchema.parse(name) })
      .where(eq(tasbih.id, tasbihId));
  };

  const remove = async (tasbihId: string): Promise<void> => {
    if (isTasbihAlZahra(tasbihId)) {
      throw new TasbihAlZahraIsPermanentError("delete");
    }
    await db.delete(tasbih).where(eq(tasbih.id, tasbihId));
  };

  const recordDhikrSession = async (
    session: DhikrSession
  ): Promise<DhikrSession> => {
    const parsed = dhikrSessionSchema.parse(session);
    await db.insert(dhikrSessions).values(parsed);
    return parsed;
  };

  const listDhikrSessions = (): Promise<DhikrSession[]> =>
    db
      .select({
        id: dhikrSessions.id,
        tasbihId: dhikrSessions.tasbihId,
        count: dhikrSessions.count,
        completedAt: dhikrSessions.completedAt,
      })
      .from(dhikrSessions)
      .orderBy(desc(dhikrSessions.completedAt));

  return {
    list,
    getTasbihAlZahraProgress,
    saveTasbihAlZahraProgress,
    rename,
    remove,
    recordDhikrSession,
    listDhikrSessions,
  };
};
