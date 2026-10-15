import { actSchema, personalProgramSchema } from "@alrisali/domain/programs";
import type {
  PersonalProgram,
  PersonalProgramInput,
} from "@alrisali/domain/programs";
import { asc, eq } from "drizzle-orm";

import type { UserDb } from "../shared";
import { personalPrograms, programSubscriptions } from "./schema";

export interface PersonalProgramsRepository {
  /** The Believer's Personal Programs, oldest first. */
  list: () => Promise<PersonalProgram[]>;
  /** One Personal Program; null when there is none. */
  get: (id: string) => Promise<PersonalProgram | null>;
  /**
   * Validates and saves a Personal Program with its Acts, new or edited (the
   * caller makes the uuid). Throws when it is invalid, saving nothing.
   */
  save: (program: PersonalProgramInput, at: Date) => Promise<PersonalProgram>;
  /**
   * Deletes a Personal Program and the Believer's Subscription to it. Its
   * Act Completions stay, as the record of what was done.
   */
  remove: (id: string) => Promise<void>;
}

type Row = typeof personalPrograms.$inferSelect;

const parseActs = (text: string): unknown[] => {
  try {
    const acts: unknown = JSON.parse(text);
    return Array.isArray(acts) ? acts : [];
  } catch {
    return [];
  }
};

/**
 * The Personal Program a row holds, or null when this app cannot read it. An
 * Act it cannot read (a newer kind, synced from a newer app) is left out.
 */
const fromRow = (row: Row): PersonalProgram | null => {
  const acts = parseActs(row.acts).flatMap((act) => {
    const parsed = actSchema.safeParse(act);
    return parsed.success ? [parsed.data] : [];
  });
  const program = personalProgramSchema.safeParse({
    id: row.id,
    name: row.name,
    description: row.description,
    acts,
  });
  return program.success ? program.data : null;
};

export const createPersonalProgramsRepository = (
  db: UserDb
): PersonalProgramsRepository => ({
  list: async () => {
    const rows = await db
      .select()
      .from(personalPrograms)
      .orderBy(asc(personalPrograms.createdAt), asc(personalPrograms.id))
      .all();
    return rows.flatMap((row) => fromRow(row) ?? []);
  },
  get: async (id) => {
    const row = await db
      .select()
      .from(personalPrograms)
      .where(eq(personalPrograms.id, id))
      .get();
    return row ? fromRow(row) : null;
  },
  save: async (input, at) => {
    const program = personalProgramSchema.parse(input);
    const values = {
      name: program.name,
      description: program.description,
      acts: JSON.stringify(program.acts),
      updatedAt: at,
    };
    await db
      .insert(personalPrograms)
      .values({ id: program.id, createdAt: at, ...values })
      .onConflictDoUpdate({ target: personalPrograms.id, set: values });
    return program;
  },
  remove: async (id) => {
    // The Subscription first: stopping in between leaves an unsubscribed
    // Program, never a Subscription to nothing that counts towards the limit.
    await db
      .delete(programSubscriptions)
      .where(eq(programSubscriptions.id, id));
    await db.delete(personalPrograms).where(eq(personalPrograms.id, id));
  },
});
