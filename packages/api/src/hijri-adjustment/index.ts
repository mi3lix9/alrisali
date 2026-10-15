import { hijriAdjustmentSchema } from "@alrisali/domain/shared";
import { oc } from "@orpc/contract";
import { z } from "zod";

const globalHijriAdjustment = z.object({ adjustment: hijriAdjustmentSchema });

/**
 * The Admins' Hijri Adjustment, published in the content database: every
 * device adds it to the Believer's own on its next sync. Admins only.
 */
export const hijriAdjustmentContract = {
  get: oc.output(globalHijriAdjustment),
  set: oc.input(globalHijriAdjustment).output(globalHijriAdjustment),
};
