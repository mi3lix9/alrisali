import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";

/** A value SQLite stores or returns. */
export type SqlValue = string | number | null | ArrayBuffer;

/** Runs one statement; each row comes back as its values in column order. */
export type Execute = (
  sql: string,
  params: readonly SqlValue[]
) => Promise<unknown[][]>;

/**
 * Typed Drizzle access to the content database: the server's writable one
 * and the device's read-only replica alike. Repositories take this.
 */
export type ContentDb = SqliteRemoteDatabase;

// Drizzle's proxy wants `get` as one row and `run` without rows.
export const createContentDb = (execute: Execute): ContentDb =>
  drizzle(async (sql, params: SqlValue[], method) => {
    const rows = await execute(sql, params);
    if (method === "run") {
      return { rows: [] };
    }
    return { rows: method === "get" ? (rows[0] as unknown[]) : rows };
  });

const MISSING_TABLE = /no such table/iu;

/**
 * Whether a query failed because its table does not exist yet: a replica
 * that has never pulled is empty. Drizzle wraps the driver's error, so the
 * causes are searched too.
 */
export const isMissingTable = (error: unknown): boolean => {
  let current: unknown = error;
  while (current instanceof Error) {
    if (MISSING_TABLE.test(current.message)) {
      return true;
    }
    current = current.cause;
  }
  return false;
};
