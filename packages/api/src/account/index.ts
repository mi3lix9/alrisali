import { oc } from "@orpc/contract";
import { z } from "zod";

export const accountContract = {
  /**
   * Anyone: the providers the Admin web offers sign-in with, the ones the
   * server has OAuth credentials for. The same providers as the app's, so an
   * Admin signs in to the web with the account they use on their phone.
   */
  webSignInProviders: oc.output(
    z.object({ providers: z.array(z.enum(["apple", "google"])) })
  ),
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
  /**
   * Deletes the caller's account for good: their Sign in with Apple is
   * revoked, then their cloud database goes, then their user, sessions and
   * linked sign-ins. The session it was called with stops working. Signing
   * in again starts a new, empty account. A Believer signed in with Apple
   * passes a fresh `appleAuthorizationCode` from Apple's sheet: the server
   * exchanges it for the token Apple revokes. `SERVICE_UNAVAILABLE` when
   * Apple refuses; nothing is deleted then.
   */
  deleteAccount: oc
    .input(
      z
        .object({ appleAuthorizationCode: z.string().min(1).optional() })
        .optional()
    )
    .output(z.object({ deleted: z.literal(true) })),
};
