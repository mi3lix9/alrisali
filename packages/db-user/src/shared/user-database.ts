import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";

import type { SqlValue, SyncedConnection } from "./connection";
import { migrate } from "./migrate";
import type { Migration } from "./migrate";
import { migrations as bundledMigrations } from "./migrations";

/** Typed Drizzle access to a Believer's database; repositories take this. */
export type UserDb = SqliteRemoteDatabase;

/** What the Turso sync binding is opened with, on the device and in tests. */
export interface ConnectOptions {
  path: string;
  /** Null while the Believer is a Guest: sync stays paused. */
  url: () => string | null;
  /** A Guest database starts empty; it never downloads on open. */
  bootstrapIfEmpty: false;
  clientName: string;
}

export interface OpenUserDatabaseOptions {
  /** Database file; one per Believer on the device. */
  path: string;
  /** The Believer's cloud database, or null for a Guest. */
  remoteUrl: () => string | null;
  /** Opens the Turso sync binding (React Native on the device, Node in tests). */
  connect: (options: ConnectOptions) => Promise<SyncedConnection>;
  /** Defaults to the migrations bundled from packages/db-user/migrations. */
  migrations?: readonly Migration[];
}

export type SyncOutcome =
  | { status: "paused" }
  | { status: "synced"; pulledChanges: boolean };

export interface UserDatabase {
  db: UserDb;
  /** The schema version reached on open. */
  schemaVersion: number;
  /**
   * Pulls, migrates, then pushes. A Guest (no URL) is paused and makes no
   * network request. `pulledChanges` tells callers to invalidate reads.
   */
  sync: () => Promise<SyncOutcome>;
  close: () => Promise<void>;
  /**
   * Sign-out: closes the database and deletes it from the device, so nothing
   * recorded reaches the next Believer (ADR-0002). The cloud copy is untouched.
   */
  wipe: () => Promise<void>;
}

const CLIENT_NAME = "alrisali";

// The binding returns rows only; Drizzle's proxy wants `get` as one row.
const toDrizzle = (connection: SyncedConnection): UserDb =>
  drizzle(async (sql, params: SqlValue[], method) => {
    if (method === "run") {
      await connection.execute(sql, params);
      return { rows: [] };
    }
    const rows = await connection.query(sql, params);
    return { rows: method === "get" ? (rows[0] as unknown[]) : rows };
  });

/**
 * Opens the Believer's database in sync mode, Guests included (ADR-0001: a
 * database opened without a URL keeps no change log and could never sync),
 * and runs the bundled migrations before anything can be pushed.
 */
export const openUserDatabase = async ({
  path,
  remoteUrl,
  connect,
  migrations = bundledMigrations,
}: OpenUserDatabaseOptions): Promise<UserDatabase> => {
  const connection = await connect({
    path,
    url: remoteUrl,
    bootstrapIfEmpty: false,
    clientName: CLIENT_NAME,
  });
  let schemaVersion: number;
  try {
    schemaVersion = await migrate(connection, migrations);
  } catch (error) {
    await connection.close();
    throw error;
  }

  const sync = async (): Promise<SyncOutcome> => {
    if (remoteUrl() === null) {
      return { status: "paused" };
    }
    const pulledChanges = await connection.pull();
    // A pull may bring an older schema version row; migrate before pushing.
    await migrate(connection, migrations);
    await connection.push();
    return { status: "synced", pulledChanges };
  };

  return {
    db: toDrizzle(connection),
    schemaVersion,
    sync,
    close: () => connection.close(),
    wipe: () => connection.destroy(),
  };
};
