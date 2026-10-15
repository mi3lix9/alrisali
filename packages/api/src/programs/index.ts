import { officialProgramSchema } from "@alrisali/domain/programs";
import { oc } from "@orpc/contract";
import { z } from "zod";

const programId = z.object({ id: z.string().trim().min(1) });

/**
 * Official Programs and their Acts, published in the content database:
 * devices read them from their replica after the next pull. Admins only.
 */
export const programsContract = {
  /** Every Program, inactive ones too, in the Admins' order. */
  list: oc.output(z.array(officialProgramSchema)),
  /** One Program with its Acts; null when there is none. */
  get: oc.input(programId).output(officialProgramSchema.nullable()),
  /**
   * Creates or replaces a Program with its Acts, in their given order. The
   * caller picks new ids (UUIDs); a new Program goes last.
   */
  save: oc.input(officialProgramSchema).output(officialProgramSchema),
  /** Deletes a Program and its Acts. */
  remove: oc.input(programId).output(z.object({})),
  /** Orders the Programs as listed. */
  reorder: oc
    .input(z.object({ ids: z.array(z.string().trim().min(1)) }))
    .output(z.object({})),
};
