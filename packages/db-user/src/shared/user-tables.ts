import { sql } from "drizzle-orm";

import type { UserDb } from "./user-database";

/** One table of the Believer's database, its rows in column order. */
export interface UserTableRows {
  name: string;
  columns: string[];
  rows: unknown[][];
}

// The sync engine's change log and SQLite's own tables, plus the migration
// counter, are bookkeeping: none of it is something the Believer recorded.
const BOOKKEEPING = /^(?:sqlite_|turso_|__turso)/u;
const SCHEMA_VERSION = "schema_version";
// Single-row preferences (theme, reader options, reminder rules): kept and
// synced, but not records a Guest would count as made.
const PREFERENCES = /(?:_settings|_preferences)$/u;

/**
 * Every table the features keep for the Believer, by name. Found in the
 * database itself, so no feature's tables are named here and a new table is
 * included as soon as its migration runs.
 */
export const listUserTables = async (db: UserDb): Promise<string[]> => {
  const rows = await db.all<[string]>(
    sql`select name from sqlite_master where type = 'table' order by name`
  );
  return rows
    .map(([name]) => name)
    .filter((name) => name !== SCHEMA_VERSION && !BOOKKEEPING.test(name));
};

/** Every row of every user table, for the Believer's own export. */
export const readUserTables = async (db: UserDb): Promise<UserTableRows[]> => {
  const names = await listUserTables(db);
  return Promise.all(
    names.map(async (name) => {
      const [columns, rows] = await Promise.all([
        db.all<[string]>(
          sql`select name from pragma_table_info(${name}) order by cid`
        ),
        db.all<unknown[]>(sql`select * from ${sql.identifier(name)}`),
      ]);
      return { name, columns: columns.map(([column]) => column), rows };
    })
  );
};

/**
 * How many records the Believer has made: the rows of every user table
 * except single-row preferences, counted in one query.
 */
export const countUserRecords = async (db: UserDb): Promise<number> => {
  const names = await listUserTables(db);
  const counted = names.filter((name) => !PREFERENCES.test(name));
  if (counted.length === 0) {
    return 0;
  }
  const counts = sql.join(
    counted.map((name) => sql`(select count(*) from ${sql.identifier(name)})`),
    sql` + `
  );
  const [row] = await db.all<[number]>(sql`select ${counts}`);
  return row?.[0] ?? 0;
};
