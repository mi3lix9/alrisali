import {
  dailyContentSchema,
  EVERY_DAY,
  supplicationIdSchema,
  WEEKDAYS,
  WORSHIP_KINDS,
  worshipEntrySchema,
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

/** Every ziyarah, night-dua and every-day entry, in a stable order. */
const worshipMap = z.object({
  entries: z.array(worshipEntrySchema),
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
  /**
   * The rest of today's worship: the Supplications Home shows as a weekday's
   * ziyarah, a weekday's night dua after Maghrib, or every day.
   */
  worshipList: oc.output(worshipMap),
  /** Replaces one kind on one day; an empty list clears it. */
  worshipSet: oc
    .input(
      z
        .object({
          kind: z.enum(WORSHIP_KINDS),
          day: z.enum([...WEEKDAYS, EVERY_DAY]),
          supplicationIds: z.array(supplicationIdSchema),
        })
        .refine(
          ({ kind, day }) => (kind === "every-day") === (day === EVERY_DAY),
          "Every-day entries have no weekday; the others need one"
        )
    )
    .output(worshipMap),
};
