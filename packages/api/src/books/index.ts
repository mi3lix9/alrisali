import { AMAL_KIND_NAMES, amalDaySchema } from "@alrisali/domain/books";
import { oc } from "@orpc/contract";
import { z } from "zod";

/** Every A'mal entry, by Hijri month, then day (0 is the whole month). */
const amalMap = z.object({
  entries: z.array(
    z.object({
      month: z.int(),
      day: z.int(),
      kind: z.enum(AMAL_KIND_NAMES),
      time: z.enum(["night", "day"]).optional(),
      supplicationId: z.string(),
    })
  ),
});

/**
 * The A'mal index Admins publish in the content database: the acts (duas,
 * ziyarat, prayers, fasts, tasbih) each Hijri day or month lists, by the
 * stable id of a Supplication a Book holds. Devices read it after their next
 * sync. Admins only.
 */
export const booksContract = {
  amalList: oc.output(amalMap),
  /** Replaces everything one day (or the whole month, day 0) lists; an empty list clears it. */
  amalSet: oc.input(amalDaySchema).output(amalMap),
};
