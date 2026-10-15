import type { Session } from "@alrisali/auth";
import type { Database } from "@alrisali/db-server";
import type { Context as HonoContext } from "hono";

import { db, auth } from "./services";

/** What every oRPC procedure receives. */
export interface Context {
  session: Session | null;
  db: Database;
}

export interface CreateContextOptions {
  context: HonoContext;
}

export const createContext = async ({
  context,
}: CreateContextOptions): Promise<Context> => {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    db,
    session,
  };
};
