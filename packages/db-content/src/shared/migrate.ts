import type { SqlValue } from "./content-db";

/** One drizzle-kit migration, bundled as its statements. */
export interface Migration {
  tag: string;
  statements: readonly string[];
}

export interface ContentStatement {
  sql: string;
  params: readonly SqlValue[];
}

/** The admin side's write access to the content database (the server's). */
export interface ContentWriter {
  /** Runs one statement, read or write; rows in column order. */
  execute: (sql: string, params: readonly SqlValue[]) => Promise<unknown[][]>;
  /** Runs the statements in one transaction: all of them or none. */
  transaction: (statements: readonly ContentStatement[]) => Promise<void>;
}

const CREATE_SCHEMA_VERSION =
  "CREATE TABLE IF NOT EXISTS schema_version (id integer PRIMARY KEY, version integer NOT NULL)";
const READ_VERSION = "SELECT version FROM schema_version WHERE id = 1";
const RECORD_VERSION =
  "INSERT INTO schema_version (id, version) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET version = max(version, excluded.version)";

// Two server instances may start together: a create that finds its table
// already made counts as done.
const UNGUARDED_CREATE =
  /^(?<create>\s*CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX))\s+(?!IF\s+NOT\s+EXISTS\b)/iu;

/**
 * Applies the migrations (the bundled `migrations`) the content database has not recorded yet,
 * each in its own transaction, and returns the schema version it ends at.
 * Only the server runs this; devices pull the resulting schema.
 */
export const migrateContent = async (
  writer: ContentWriter,
  migrations: readonly Migration[]
): Promise<number> => {
  await writer.execute(CREATE_SCHEMA_VERSION, []);
  const [row] = await writer.execute(READ_VERSION, []);
  const recorded = Number(row?.[0] ?? 0);

  for (const [offset, migration] of migrations.slice(recorded).entries()) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- migrations run in order
      await writer.transaction([
        ...migration.statements.map((statement) => ({
          sql: statement.replace(UNGUARDED_CREATE, "$<create> IF NOT EXISTS "),
          params: [],
        })),
        { sql: RECORD_VERSION, params: [recorded + offset + 1] },
      ]);
    } catch (error) {
      throw new Error(`Content migration ${migration.tag} failed`, {
        cause: error,
      });
    }
  }
  return Math.max(recorded, migrations.length);
};
