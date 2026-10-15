import type { SyncedConnection } from "./connection";

/** One drizzle-kit migration, bundled as its statements. */
export interface Migration {
  tag: string;
  statements: readonly string[];
}

const CREATE_SCHEMA_VERSION =
  "CREATE TABLE IF NOT EXISTS schema_version (id integer PRIMARY KEY, version integer NOT NULL)";
const READ_VERSION = "SELECT version FROM schema_version WHERE id = 1";
// Never lowers the version: a newer device may already have pushed a higher one.
const RECORD_VERSION =
  "INSERT INTO schema_version (id, version) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET version = max(version, excluded.version)";

const UNGUARDED_CREATE =
  /^(?<create>\s*CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX))\s+(?!IF\s+NOT\s+EXISTS\b)/iu;
const DUPLICATE_COLUMN = /duplicate column/iu;

/**
 * A pull can bring tables and columns a newer device created before this
 * database's version row says so, so every statement tolerates finding its
 * work done: creates gain IF NOT EXISTS, and an added column that already
 * exists counts as added.
 */
const applyStatement = async (
  connection: SyncedConnection,
  statement: string
): Promise<void> => {
  try {
    await connection.execute(
      statement.replace(UNGUARDED_CREATE, "$<create> IF NOT EXISTS "),
      []
    );
  } catch (error) {
    if (!(error instanceof Error && DUPLICATE_COLUMN.test(error.message))) {
      throw error;
    }
  }
};

const applyMigration = async (
  connection: SyncedConnection,
  migration: Migration,
  version: number
): Promise<void> => {
  await connection.execute("BEGIN", []);
  try {
    for (const statement of migration.statements) {
      // oxlint-disable-next-line no-await-in-loop -- statements run in order
      await applyStatement(connection, statement);
    }
    await connection.execute(RECORD_VERSION, [version]);
    await connection.execute("COMMIT", []);
  } catch (error) {
    await connection.execute("ROLLBACK", []);
    throw new Error(`Migration ${migration.tag} failed`, { cause: error });
  }
};

/**
 * Applies the bundled migrations the database has not recorded yet, each in
 * its own transaction, and returns the schema version the database ends at.
 * The version is the number of bundled migrations applied.
 */
export const migrate = async (
  connection: SyncedConnection,
  migrations: readonly Migration[]
): Promise<number> => {
  await connection.execute(CREATE_SCHEMA_VERSION, []);
  const [row] = await connection.query(READ_VERSION, []);
  const recorded = Number(row?.[0] ?? 0);

  for (const [offset, migration] of migrations.slice(recorded).entries()) {
    // oxlint-disable-next-line no-await-in-loop -- migrations run in order
    await applyMigration(connection, migration, recorded + offset + 1);
  }
  return Math.max(recorded, migrations.length);
};
