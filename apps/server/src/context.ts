import type { Auth, Session } from "@alrisali/auth";
import type { Database } from "@alrisali/db-server";

import type { UserDatabaseHost } from "@/features/account";

/** What every oRPC procedure receives. */
export interface Context {
  session: Session | null;
  db: Database;
  /** Where Believers' cloud databases are created and tokens minted. */
  userDatabases: UserDatabaseHost;
}

export interface CreateContextOptions {
  auth: Auth;
  db: Database;
  userDatabases: UserDatabaseHost;
  headers: Headers;
}

/** Resolves the caller's session from the request's cookies, if any. */
export const createContext = async ({
  auth,
  db,
  userDatabases,
  headers,
}: CreateContextOptions): Promise<Context> => ({
  db,
  userDatabases,
  session: await auth.api.getSession({ headers }),
});
