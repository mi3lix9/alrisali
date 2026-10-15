import { oc } from "@orpc/contract";
import { z } from "zod";

/** Procedures no single feature owns. */
export const sharedContract = {
  healthCheck: oc.output(z.literal("OK")),
};
