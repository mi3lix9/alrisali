import { oc } from "@orpc/contract";
import { z } from "zod";

/** Procedures no single feature owns. */
export const sharedContract = {
  healthCheck: oc.output(z.literal("OK")),
  /**
   * Where the shared content database is and a short-lived read-only token
   * for it (ADR-0001): every device, Guests included, keeps a pull-only
   * replica. `expiresAt` is in epoch milliseconds.
   */
  contentReplica: oc.output(
    z.object({
      url: z.url(),
      token: z.string().min(1),
      expiresAt: z.number().int(),
    })
  ),
};
