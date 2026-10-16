import {
  createContentDb,
  migrateContent,
  migrations,
} from "@alrisali/db-content/shared";
import type { ContentDb } from "@alrisali/db-content/shared";

import { createHranaPipeline } from "./hrana-pipeline";
import type { UserDatabaseHost } from "./user-database-host";

/** A minted database token and when it stops working (epoch ms). */
export interface DatabaseToken {
  token: string;
  expiresAt: number;
}

export interface ContentReplicaAccess extends DatabaseToken {
  /** Where devices pull the content database from. */
  url: string;
}

/**
 * The shared content database (ADR-0001): written only here, by Admins'
 * procedures; every device keeps a pull-only replica.
 */
export interface ContentDatabase {
  /** Drizzle over the content database, created and migrated on first use. */
  db: () => Promise<ContentDb>;
  /** The sync URL and a read-only token for devices. */
  replicaAccess: () => Promise<ContentReplicaAccess>;
}

export interface ContentDatabaseOptions {
  /** The same host as Believers' databases: Turso Cloud or the local server. */
  host: UserDatabaseHost;
  /** The content database's name on the host. */
  name: string;
}

/** Reuse a token until this long before it expires. */
const TOKEN_REUSE_MARGIN_MS = 10 * 60 * 1000;

const reusedToken = (mint: () => Promise<DatabaseToken>) => {
  let current: Promise<DatabaseToken> | undefined;
  return async (): Promise<DatabaseToken> => {
    const pending = current;
    if (pending) {
      try {
        const token = await pending;
        if (token.expiresAt - TOKEN_REUSE_MARGIN_MS > Date.now()) {
          return token;
        }
      } catch {
        // A failed mint is retried below.
      }
    }
    current = mint();
    return current;
  };
};

/** Runs `work` once and shares its result; a failure is retried next time. */
const retriedOnce = <T>(work: () => Promise<T>): (() => Promise<T>) => {
  let running: Promise<T> | undefined;
  const attempt = async (): Promise<T> => {
    try {
      return await work();
    } catch (error) {
      running = undefined;
      throw error;
    }
  };
  return () => {
    running ??= attempt();
    return running;
  };
};

export const createContentDatabase = ({
  host,
  name,
}: ContentDatabaseOptions): ContentDatabase => {
  const writeToken = reusedToken(() => host.mintToken(name, "full-access"));
  // Devices pull with this: Turso refuses a push or a write made with it.
  const readToken = reusedToken(() => host.mintToken(name, "read-only"));

  const ensured = retriedOnce(async () => {
    const { url } = await host.ensure(name);
    return url;
  });
  const opened = retriedOnce(async () => {
    const writer = createHranaPipeline({
      url: await ensured(),
      authToken: async () => {
        const { token } = await writeToken();
        return token;
      },
    });
    await migrateContent(writer, migrations);
    return createContentDb(writer.execute, writer.transaction);
  });

  return {
    db: opened,
    // Devices may pull before any Admin publishes: the replica stays empty
    // and reads the defaults until the first migration and write arrive.
    replicaAccess: async () => {
      const url = await ensured();
      return { url, ...(await readToken()) };
    },
  };
};
