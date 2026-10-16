import { adminHijriAdjustmentSchema } from "@alrisali/domain/shared";
import { oc } from "@orpc/contract";

/**
 * The Admins' Hijri Adjustment, published in the content database: a day
 * offset, or a forced date with an expiry that replaces it while it lasts.
 * Every device adds it to the Believer's own on its next sync. Admins only.
 * `set` refuses (BAD_REQUEST) a forced day the computed month does not have,
 * or one more than two days from the computed date.
 */
export const hijriAdjustmentContract = {
  get: oc.output(adminHijriAdjustmentSchema),
  set: oc.input(adminHijriAdjustmentSchema).output(adminHijriAdjustmentSchema),
};
