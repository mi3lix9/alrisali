import type { Auth, Session } from "@alrisali/auth";
import type { Database } from "@alrisali/db-server";

/** What every oRPC procedure receives. */
export interface Context {
  session: Session | null;
  db: Database;
}

export interface CreateContextOptions {
  auth: Auth;
  db: Database;
  headers: Headers;
}

/** Resolves the caller's session from the request's cookies, if any. */
export const createContext = async ({
  auth,
  db,
  headers,
}: CreateContextOptions): Promise<Context> => ({
  db,
  session: await auth.api.getSession({ headers }),
});
