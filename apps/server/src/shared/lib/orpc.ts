import { contract } from "@alrisali/api";
import { ORPCError, implement } from "@orpc/server";

import type { Context } from "../../context";

/** Implements the API contract; features build their procedures from it. */
export const os = implement(contract).$context<Context>();

/** Procedures that refuse a request without a signed-in session. */
export const authed = os.use(({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
    },
  });
});
