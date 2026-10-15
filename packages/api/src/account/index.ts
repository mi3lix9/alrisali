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
};
