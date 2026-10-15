import type { Auth, Session } from "@alrisali/auth";
import type { Database } from "@alrisali/db-server";

import type { RecitationSource } from "./shared/lib/recitation-source";
import type { UserDatabaseHost } from "./shared/lib/user-database-host";

/** What every oRPC procedure receives. */
export interface Context {
  session: Session | null;
  db: Database;
  /** Where Believers' cloud databases are created and tokens minted. */
  userDatabases: UserDatabaseHost;
  /** Recitation from the Quran Foundation audio API. */
  recitation: RecitationSource;
}

export interface CreateContextOptions {
  auth: Auth;
  db: Database;
  userDatabases: UserDatabaseHost;
  recitation: RecitationSource;
  headers: Headers;
}

/** Resolves the caller's session from the request's cookies, if any. */
export const createContext = async ({
  auth,
  db,
  userDatabases,
  recitation,
  headers,
}: CreateContextOptions): Promise<Context> => ({
  db,
  userDatabases,
  recitation,
  session: await auth.api.getSession({ headers }),
});
