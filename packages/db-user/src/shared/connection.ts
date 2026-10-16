/** A value SQLite stores or returns, as both Turso bindings take it. */
export type SqlValue = string | number | null | ArrayBuffer;

/**
 * The Turso sync database underneath a Believer's database, as one small
 * interface: the device adapts `@tursodatabase/sync-react-native`, tests
 * adapt the Node `@tursodatabase/sync` (the same engine).
 */
export interface SyncedConnection {
  /** Runs a statement that returns no rows. */
  execute: (sql: string, params: readonly SqlValue[]) => Promise<void>;
  /** Runs a query; each row is its values in column order. */
  query: (sql: string, params: readonly SqlValue[]) => Promise<unknown[][]>;
  /** Pulls remote changes; true when any arrived. */
  pull: () => Promise<boolean>;
  /** Pushes local changes. */
  push: () => Promise<void>;
  close: () => Promise<void>;
  /** Closes the connection and deletes the database's files on this device. */
  destroy: () => Promise<void>;
}

/**
 * Whether a file belongs to the database stored at `databaseFile`: the sync
 * engine keeps it plus `<file>-wal`, `-info`, `-changes` and others beside it.
 */
export const isDatabaseFile = (fileName: string, databaseFile: string) =>
  fileName === databaseFile || fileName.startsWith(`${databaseFile}-`);
