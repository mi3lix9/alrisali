import type { UserDatabaseHost } from "@/shared/lib/user-database-host";

import { createLocalSyncHost } from "./local-sync-host";
import { createTursoHost } from "./turso-host";

export interface UserDatabaseHostEnv {
  NODE_ENV?: string;
  TURSO_ORG?: string;
  TURSO_API_TOKEN?: string;
  TURSO_GROUP?: string;
  LOCAL_SYNC_SERVER_URL?: string;
}

const TURSO_VARIABLES = [
  "TURSO_ORG",
  "TURSO_API_TOKEN",
  "TURSO_GROUP",
] as const;

/**
 * Turso Cloud when any TURSO_* variable is set (then all three must be);
 * otherwise, outside production, the local sync server.
 */
export const createUserDatabaseHost = (
  env: UserDatabaseHostEnv
): UserDatabaseHost => {
  const { TURSO_ORG, TURSO_API_TOKEN, TURSO_GROUP } = env;
  if (
    TURSO_ORG ||
    TURSO_API_TOKEN ||
    TURSO_GROUP ||
    env.NODE_ENV === "production"
  ) {
    if (!(TURSO_ORG && TURSO_API_TOKEN && TURSO_GROUP)) {
      const missing = TURSO_VARIABLES.filter((name) => !env[name]);
      throw new Error(
        `Missing ${missing.join(", ")}: Believers' cloud databases need the Turso Platform API`
      );
    }
    return createTursoHost({
      org: TURSO_ORG,
      apiToken: TURSO_API_TOKEN,
      group: TURSO_GROUP,
    });
  }
  if (!env.LOCAL_SYNC_SERVER_URL) {
    throw new Error(
      "Missing LOCAL_SYNC_SERVER_URL (a local tursodb --sync-server) or TURSO_ORG, TURSO_API_TOKEN, TURSO_GROUP"
    );
  }
  return createLocalSyncHost({ baseUrl: env.LOCAL_SYNC_SERVER_URL });
};
