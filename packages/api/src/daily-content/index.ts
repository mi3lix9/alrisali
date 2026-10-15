import {
  dailyContentSchema,
  supplicationIdSchema,
  WEEKDAYS,
} from "@alrisali/domain/daily-content";
import { oc } from "@orpc/contract";
import { z } from "zod";

/** Every weekday in week order, each with its Supplication id or null. */
const dailyContentMap = z.object({
  days: z.array(
    z.object({
      weekday: z.enum(WEEKDAYS),
      supplicationId: z.string().nullable(),
    })
  ),
});

/**
 * The Daily Content Admins publish in the content database: one Supplication
 * (by its stable id, which must be in a Book) per weekday, or none. Devices
 * show it on Home after their next sync. Admins only.
 */
export const dailyContentContract = {
  list: oc.output(dailyContentMap),
  set: oc
    .input(
      dailyContentSchema.extend({
        supplicationId: supplicationIdSchema.nullable(),
      })
    )
    .output(dailyContentMap),
};
