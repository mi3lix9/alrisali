import {
  dhikrSessionSchema,
  isTasbihAlZahra,
  openTasbihDetailsSchema,
  restoreTasbihAlZahra,
  TASBIH_AL_ZAHRA_ID,
  TASBIH_AL_ZAHRA_START,
  TasbihAlZahraIsPermanentError,
} from "@alrisali/domain/tasbih";
import type {
  DhikrSession,
  OpenTasbihDetailsInput,
  TasbihAlZahraProgress,
} from "@alrisali/domain/tasbih";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { UserDb } from "../shared";
import { dhikrSessions, tasbih } from "./schema";

const TASBIH_AL_ZAHRA_KIND = "tasbih-al-zahra";
const OPEN_KIND = "open";

export interface OpenTasbih {
  id: string;
  kind: typeof OPEN_KIND;
  name: string;
  target: number | null;
  notes: string | null;
  count: number;
}

export type Tasbih =
  | {
      id: string;
      kind: typeof TASBIH_AL_ZAHRA_KIND;
      progress: TasbihAlZahraProgress;
    }
  | OpenTasbih;

export interface TasbihRepository {
  /** Every Tasbih, Tasbih al-Zahra first. It is listed even before its first tap. */
  list: () => Promise<Tasbih[]>;
  getTasbihAlZahraProgress: () => Promise<TasbihAlZahraProgress>;
  saveTasbihAlZahraProgress: (progress: TasbihAlZahraProgress) => Promise<void>;
  /** Creates an Open Tasbih (the caller supplies a uuid), counting from 0. */
  createOpenTasbih: (
    tasbihId: string,
    details: OpenTasbihDetailsInput
  ) => Promise<OpenTasbih>;
  /** An Open Tasbih, or null when there is none with this id. */
  getOpenTasbih: (tasbihId: string) => Promise<OpenTasbih | null>;
  /**
   * Changes an Open Tasbih's name, target and notes, keeping its count;
   * Tasbih al-Zahra cannot be edited.
   */
  editOpenTasbih: (
    tasbihId: string,
    details: OpenTasbihDetailsInput
  ) => Promise<void>;
  saveOpenTasbihCount: (tasbihId: string, count: number) => Promise<void>;
  /**
   * Records the Open Tasbih's count as a Dhikr Session, then starts the
   * Open Tasbih again from 0. Returns the recorded session.
   */
  saveOpenTasbihSession: (session: DhikrSession) => Promise<DhikrSession>;
  /** Deletes an Open Tasbih; Tasbih al-Zahra cannot be deleted. */
  remove: (tasbihId: string) => Promise<void>;
  /** Validates and records a Dhikr Session, then returns it. */
  recordDhikrSession: (session: DhikrSession) => Promise<DhikrSession>;
  /** Every Dhikr Session, newest first. */
  listDhikrSessions: () => Promise<DhikrSession[]>;
}

const countSchema = z.number().int().nonnegative();

const OPEN_TASBIH_COLUMNS = {
  id: tasbih.id,
  name: tasbih.name,
  target: tasbih.target,
  notes: tasbih.notes,
  count: tasbih.count,
};

const toOpenTasbih = (row: {
  id: string;
  name: string | null;
  target: number | null;
  notes: string | null;
  count: number;
}): OpenTasbih => ({
  id: row.id,
  kind: OPEN_KIND,
  name: row.name ?? "",
  target: row.target,
  notes: row.notes,
  count: row.count,
});

const isOpenTasbih = (tasbihId: string) =>
  and(eq(tasbih.id, tasbihId), eq(tasbih.kind, OPEN_KIND));

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
      .select(OPEN_TASBIH_COLUMNS)
      .from(tasbih)
      .where(eq(tasbih.kind, OPEN_KIND))
      .orderBy(asc(tasbih.name), asc(tasbih.id));
    return [
      {
        id: TASBIH_AL_ZAHRA_ID,
        kind: TASBIH_AL_ZAHRA_KIND,
        progress: await getTasbihAlZahraProgress(),
      },
      ...open.map(toOpenTasbih),
    ];
  };

  const createOpenTasbih = async (
    tasbihId: string,
    details: OpenTasbihDetailsInput
  ): Promise<OpenTasbih> => {
    const { name, target, notes } = openTasbihDetailsSchema.parse(details);
    const row = { id: tasbihId, name, target, notes, count: 0 };
    await db.insert(tasbih).values({ ...row, kind: OPEN_KIND });
    return toOpenTasbih(row);
  };

  const getOpenTasbih = async (
    tasbihId: string
  ): Promise<OpenTasbih | null> => {
    const row = await db
      .select(OPEN_TASBIH_COLUMNS)
      .from(tasbih)
      .where(isOpenTasbih(tasbihId))
      .get();
    return row ? toOpenTasbih(row) : null;
  };

  const editOpenTasbih = async (
    tasbihId: string,
    details: OpenTasbihDetailsInput
  ): Promise<void> => {
    if (isTasbihAlZahra(tasbihId)) {
      throw new TasbihAlZahraIsPermanentError("rename");
    }
    const { name, target, notes } = openTasbihDetailsSchema.parse(details);
    await db
      .update(tasbih)
      .set({ name, target, notes })
      .where(isOpenTasbih(tasbihId));
  };

  const saveOpenTasbihCount = async (
    tasbihId: string,
    count: number
  ): Promise<void> => {
    await db
      .update(tasbih)
      .set({ count: countSchema.parse(count) })
      .where(isOpenTasbih(tasbihId));
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

  const saveOpenTasbihSession = async (
    session: DhikrSession
  ): Promise<DhikrSession> => {
    const recorded = await recordDhikrSession(session);
    await saveOpenTasbihCount(recorded.tasbihId, 0);
    return recorded;
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
    createOpenTasbih,
    getOpenTasbih,
    editOpenTasbih,
    saveOpenTasbihCount,
    saveOpenTasbihSession,
    remove,
    recordDhikrSession,
    listDhikrSessions,
  };
};
