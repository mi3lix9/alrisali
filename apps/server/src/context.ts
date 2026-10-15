import type { Context as ApiContext } from "@alrisali/api/context";
import type { Context as HonoContext } from "hono";

import { db, auth } from "./services";

export interface CreateContextOptions {
  context: HonoContext;
}

export const createContext = async ({
  context,
}: CreateContextOptions): Promise<ApiContext> => {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    db,
    session,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
