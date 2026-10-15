import { occasionDetailsSchema, occasionSchema } from "@alrisali/domain/shared";
import { oc } from "@orpc/contract";
import { z } from "zod";

const occasionId = z.object({ id: z.string().min(1) });

/**
 * The Occasions Admins publish in the content database; devices show them
 * beside the built-in ones after their next sync. Admins only.
 */
export const occasionsContract = {
  /** The published Occasions in calendar order; the built-in ones are not. */
  list: oc.output(z.object({ occasions: z.array(occasionSchema) })),
  create: oc.input(occasionDetailsSchema).output(occasionSchema),
  /** Null when the Occasion was deleted meanwhile. */
  update: oc
    .input(occasionDetailsSchema.extend(occasionId.shape))
    .output(occasionSchema.nullable()),
  /** Deleting one already gone is no error: `deleted` is false. */
  delete: oc.input(occasionId).output(z.object({ deleted: z.boolean() })),
};
