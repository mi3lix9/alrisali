import { oc } from "@orpc/contract";
import { z } from "zod";

export const accountContract = {
  /** Answers only a signed-in Believer. */
  privateData: oc.output(
    z.object({
      message: z.string(),
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      }),
    })
  ),
  /**
   * Creates the Believer's cloud database on first call (ADR-0001) and
   * returns where their device syncs it. Safe to call again: it never
   * creates a second one.
   */
  ensureUserDatabase: oc.output(z.object({ url: z.url() })),
  /**
   * A short-lived token that opens only the caller's cloud database.
   * `expiresAt` is in epoch milliseconds; fetch a new one before then.
   */
  userDatabaseToken: oc.output(
    z.object({ token: z.string().min(1), expiresAt: z.number().int() })
  ),
};
