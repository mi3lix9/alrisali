import { contract } from "@alrisali/api";
import { isAdmin } from "@alrisali/auth";
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

/**
 * Procedures for Admins only: a signed-in Believer without the Admin role is
 * refused. The role is read from the session's user on every request, so
 * revoking it takes effect at once.
 */
export const admin = authed.use(({ context, next }) => {
  if (!isAdmin(context.session.user)) {
    throw new ORPCError("FORBIDDEN");
  }
  return next();
});
