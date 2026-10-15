// Seam 2 test support: the same Turso sync engine as the device, through the
// Node binding, behind the same SyncedConnection interface. Tests only.
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { connect } from "@tursodatabase/sync";

import { isDatabaseFile } from "./connection";
import type { SyncedConnection } from "./connection";
import type { ConnectOptions } from "./user-database";

export const connectNode = async (
  options: ConnectOptions
): Promise<SyncedConnection> => {
  const database = await connect(options);
  return {
    execute: async (sql, params) => {
      const statement = await database.prepare(sql);
      await statement.run(...params);
    },
    query: async (sql, params) => {
      const statement = await database.prepare(sql);
      return statement.raw(true).all(...params);
    },
    pull: () => database.pull(),
    push: () => database.push(),
    close: () => database.close(),
    destroy: async () => {
      await database.close();
      const directory = path.dirname(options.path);
      const file = path.basename(options.path);
      for (const name of readdirSync(directory)) {
        if (isDatabaseFile(name, file)) {
          rmSync(path.join(directory, name), { force: true });
        }
      }
    },
  };
};

export interface TemporaryDirectory {
  path: string;
  remove: () => void;
}

/** A fresh directory for database files; `remove` deletes it. */
export const temporaryDirectory = (): TemporaryDirectory => {
  const directory = mkdtempSync(path.join(tmpdir(), "alrisali-db-user-"));
  return {
    path: directory,
    remove: () => rmSync(directory, { force: true, recursive: true }),
  };
};

export { startSyncServer } from "./sync-server";
export type { SyncServer } from "./sync-server";
