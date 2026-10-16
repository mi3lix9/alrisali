import { createContentDb } from "./content-db";
import type { ContentDb, SqlValue } from "./content-db";

/**
 * The Turso sync database underneath the device's content replica. It has
 * no way to write or push: the device only reads and pulls (the device
 * adapts `@tursodatabase/sync-react-native`, tests the Node binding).
 */
export interface ReplicaConnection {
  /** Runs a query; each row is its values in column order. */
  query: (sql: string, params: readonly SqlValue[]) => Promise<unknown[][]>;
  /** Pulls what the Admins published; true when any arrived. */
  pull: () => Promise<boolean>;
  close: () => Promise<void>;
}

/** What the Turso sync binding is opened with, on the device and in tests. */
export interface ReplicaConnectOptions {
  path: string;
  /** Null until the server says where the content database is: no sync. */
  url: () => string | null;
  /** A short-lived read-only token for the content database, per request. */
  authToken?: () => Promise<string>;
  /** An empty replica downloads the content when it opens with a URL. */
  bootstrapIfEmpty: true;
  clientName: string;
}

export interface OpenContentReplicaOptions {
  /** Replica file on the device; shared by everyone who uses it. */
  path: string;
  /** The content database's sync URL, or null while unknown (offline). */
  remoteUrl: () => string | null;
  /** Fetches the read-only token; the engine asks on every request. */
  authToken?: () => Promise<string>;
  connect: (options: ReplicaConnectOptions) => Promise<ReplicaConnection>;
}

export type ReplicaSyncOutcome =
  | { status: "paused" }
  | { status: "pulled"; pulledChanges: boolean };

export interface ContentReplica {
  /** Reads only: any statement but a SELECT is refused. */
  db: ContentDb;
  /** Pulls (never pushes); paused, without a request, while the URL is unknown. */
  sync: () => Promise<ReplicaSyncOutcome>;
  close: () => Promise<void>;
}

const CLIENT_NAME = "alrisali-content";
const READ = /^\s*SELECT\b/iu;

/** A write on the device: only Admins change content, through the server. */
export class ContentReplicaReadOnlyError extends Error {
  constructor(sql: string) {
    super(`The content replica is read-only; refused: ${sql}`);
    this.name = "ContentReplicaReadOnlyError";
  }
}

/**
 * Opens the device's pull-only copy of the content database (ADR-0001). It
 * reads offline whatever the last pull brought; the server's read-only
 * token keeps Turso from accepting a push even if one were attempted.
 */
export const openContentReplica = async ({
  path,
  remoteUrl,
  authToken,
  connect,
}: OpenContentReplicaOptions): Promise<ContentReplica> => {
  const connection = await connect({
    path,
    url: remoteUrl,
    ...(authToken ? { authToken } : {}),
    bootstrapIfEmpty: true,
    clientName: CLIENT_NAME,
  });

  return {
    db: createContentDb((sql, params) => {
      if (!READ.test(sql)) {
        return Promise.reject(new ContentReplicaReadOnlyError(sql));
      }
      return connection.query(sql, params);
    }),
    sync: async () => {
      if (remoteUrl() === null) {
        return { status: "paused" };
      }
      return { status: "pulled", pulledChanges: await connection.pull() };
    },
    close: () => connection.close(),
  };
};
