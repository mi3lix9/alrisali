import { drizzle } from "drizzle-orm/sqlite-proxy";
import type {
  AsyncBatchRemoteCallback,
  SqliteRemoteDatabase,
} from "drizzle-orm/sqlite-proxy";

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

/**
 * Runs write statements in one transaction: all of them or none (the
 * server's content writer). `db.batch([...])` uses it.
 */
export type Transaction = (
  statements: readonly { sql: string; params: readonly SqlValue[] }[]
) => Promise<void>;

const rowsFor = (rows: unknown[][], method: string): unknown[] => {
  if (method === "run") {
    return [];
  }
  return method === "get" ? (rows[0] as unknown[]) : rows;
};

// Drizzle's proxy wants `get` as one row and `run` without rows. A batch of
// writes goes through `transaction` when given; anything else runs in turn
// (the device's replica refuses writes either way).
export const createContentDb = (
  execute: Execute,
  transaction?: Transaction
): ContentDb => {
  const runBatch: AsyncBatchRemoteCallback = async (batch) => {
    if (transaction && batch.every(({ method }) => method === "run")) {
      await transaction(batch);
      return batch.map(() => ({ rows: [] }));
    }
    const results: { rows: unknown[] }[] = [];
    for (const { sql, params, method } of batch) {
      // oxlint-disable-next-line no-await-in-loop -- statements run in order
      results.push({ rows: rowsFor(await execute(sql, params), method) });
    }
    return results;
  };
  return drizzle(
    async (sql, params: SqlValue[], method) => ({
      rows: rowsFor(await execute(sql, params), method),
    }),
    runBatch
  );
};

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
