import { actSchema, officialProgramSchema } from "@alrisali/domain/programs";
import type { Act, OfficialProgram } from "@alrisali/domain/programs";
import { asc, eq, max } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import { isMissingTable } from "../shared/content-db";
import type { ContentDb } from "../shared/content-db";
import { programActs, programs } from "./schema";

type ProgramRow = typeof programs.$inferSelect;
type ActRow = typeof programActs.$inferSelect;

export interface ListProgramsOptions {
  /** Admins see inactive Programs too; devices only active ones. */
  includeInactive?: boolean;
}

export interface ProgramsRepository {
  /**
   * Official Programs with their Acts, in the Admins' order. Empty while a
   * device's replica has never pulled. A row this app cannot read (a newer
   * kind of Act, say) is left out rather than failing the list.
   */
  list: (options?: ListProgramsOptions) => Promise<OfficialProgram[]>;
  /** One Program with its Acts; null when there is none. */
  get: (id: string) => Promise<OfficialProgram | null>;
  /**
   * Publishes a Program and its Acts as given, in one transaction (the
   * server only; replicas refuse). A new Program goes last in the order.
   */
  save: (program: OfficialProgram) => Promise<void>;
  /** Deletes a Program and its Acts; nothing happens for an unknown id. */
  remove: (id: string) => Promise<void>;
  /** Puts Programs in the order of `ids` (the Admins send every one). */
  reorder: (ids: readonly string[]) => Promise<void>;
}

const parseJson = (text: string | null): unknown => {
  if (text === null) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const actFromRow = (row: ActRow): Act | null => {
  const parsed = actSchema.safeParse({
    id: row.id,
    name: { ar: row.nameAr, en: row.nameEn },
    description: { ar: row.descriptionAr, en: row.descriptionEn },
    schedule: parseJson(row.schedule),
    salah: parseJson(row.salah),
    detail: parseJson(row.detail),
  });
  return parsed.success ? parsed.data : null;
};

const programFromRow = (
  row: ProgramRow,
  acts: readonly ActRow[]
): OfficialProgram | null => {
  const parsed = officialProgramSchema.safeParse({
    id: row.id,
    category: row.category,
    name: { ar: row.nameAr, en: row.nameEn },
    description: { ar: row.descriptionAr, en: row.descriptionEn },
    active: row.active,
    window: {
      start: { month: row.windowStartMonth, day: row.windowStartDay },
      end: { month: row.windowEndMonth, day: row.windowEndDay },
    },
    acts: acts.map(actFromRow).filter((act) => act !== null),
  });
  return parsed.success ? parsed.data : null;
};

const programValues = (program: OfficialProgram) => {
  const window = program.category === "seasonal" ? program.window : null;
  return {
    category: program.category,
    nameAr: program.name.ar,
    nameEn: program.name.en,
    descriptionAr: program.description.ar,
    descriptionEn: program.description.en,
    windowStartMonth: window?.start.month ?? null,
    windowStartDay: window?.start.day ?? null,
    windowEndMonth: window?.end.month ?? null,
    windowEndDay: window?.end.day ?? null,
    active: program.active,
  };
};

const actValues = (programId: string, act: Act, position: number) => ({
  id: act.id,
  programId,
  position,
  nameAr: act.name.ar,
  nameEn: act.name.en,
  descriptionAr: act.description.ar,
  descriptionEn: act.description.en,
  schedule: JSON.stringify(act.schedule),
  salah: act.salah === null ? null : JSON.stringify(act.salah),
  detail: JSON.stringify(act.detail),
});

/** Programs with their own Acts; nothing on a replica that has never pulled. */
const read = async (
  programRows: PromiseLike<ProgramRow[]>,
  actRows: PromiseLike<ActRow[]>
): Promise<OfficialProgram[]> => {
  try {
    const [rows, acts] = await Promise.all([programRows, actRows]);
    return rows
      .map((row) =>
        programFromRow(
          row,
          acts.filter(({ programId }) => programId === row.id)
        )
      )
      .filter((program) => program !== null);
  } catch (error) {
    if (isMissingTable(error)) {
      return [];
    }
    throw error;
  }
};

type Batch = [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]];

export const createProgramsRepository = (
  db: ContentDb
): ProgramsRepository => ({
  list: ({ includeInactive = false } = {}) =>
    read(
      db
        .select()
        .from(programs)
        .where(includeInactive ? undefined : eq(programs.active, true))
        .orderBy(asc(programs.position), asc(programs.id)),
      db
        .select()
        .from(programActs)
        .orderBy(asc(programActs.position), asc(programActs.id))
    ),
  get: async (id) => {
    const [program] = await read(
      db.select().from(programs).where(eq(programs.id, id)),
      db
        .select()
        .from(programActs)
        .where(eq(programActs.programId, id))
        .orderBy(asc(programActs.position), asc(programActs.id))
    );
    return program ?? null;
  },
  save: async (program) => {
    const [last] = await db
      .select({ position: max(programs.position) })
      .from(programs);
    const values = programValues(program);
    const statements: Batch = [
      db
        .insert(programs)
        .values({
          id: program.id,
          position: (last?.position ?? -1) + 1,
          ...values,
        })
        .onConflictDoUpdate({ target: programs.id, set: values }),
      db.delete(programActs).where(eq(programActs.programId, program.id)),
    ];
    if (program.acts.length > 0) {
      statements.push(
        db
          .insert(programActs)
          .values(
            program.acts.map((act, position) =>
              actValues(program.id, act, position)
            )
          )
      );
    }
    await db.batch(statements);
  },
  remove: async (id) => {
    await db.batch([
      db.delete(programActs).where(eq(programActs.programId, id)),
      db.delete(programs).where(eq(programs.id, id)),
    ]);
  },
  reorder: async (ids) => {
    const [first, ...rest] = ids.map((id, position) =>
      db.update(programs).set({ position }).where(eq(programs.id, id))
    );
    if (first) {
      await db.batch([first, ...rest]);
    }
  },
});
