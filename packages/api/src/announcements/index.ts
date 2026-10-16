import {
  announcementDraftSchema,
  announcementLanguageSchema,
  announcementSchema,
} from "@alrisali/domain/announcements";
import { oc } from "@orpc/contract";
import { z } from "zod";

const byId = z.object({ id: z.string().min(1) });

/** An Expo push token, as `getExpoPushTokenAsync` returns it. */
const pushToken = z
  .string()
  .regex(/^Expo(?:nent)?PushToken\[.+\]$/u, "Not an Expo push token");

/** An Announcement as a device's inbox shows it, in the language it was sent. */
const receivedAnnouncement = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  sentAt: z.number().int(),
});

/**
 * Announcements: Admins write them in Arabic and English, then schedule or
 * publish them; the server sends each through Expo Push to the devices in
 * its audience, in each device's language. Admins only, except the device
 * procedures (`registerDevice`, `inbox`), which Guests call too.
 */
export const announcementsContract = {
  /** Newest first; archived ones only with `includeArchived`. */
  list: oc
    .input(z.object({ includeArchived: z.boolean().optional() }).optional())
    .output(z.object({ announcements: z.array(announcementSchema) })),
  get: oc.input(byId).output(announcementSchema),
  /** A new draft. */
  create: oc.input(announcementDraftSchema).output(announcementSchema),
  /** Rewrites a draft or a scheduled one; a sent one is CONFLICT. */
  update: oc
    .input(announcementDraftSchema.extend(byId.shape))
    .output(announcementSchema),
  /**
   * Sends it at `at` (epoch ms). BAD_REQUEST while a language misses its
   * title or body; CONFLICT once sent.
   */
  schedule: oc
    .input(byId.extend({ at: z.number().int() }))
    .output(announcementSchema),
  /** Turns a scheduled Announcement back into a draft. */
  unschedule: oc.input(byId).output(announcementSchema),
  /** Sends it now; `devices` is how many it went to. */
  publishNow: oc
    .input(byId)
    .output(
      z.object({ announcement: announcementSchema, devices: z.number().int() })
    ),
  /** A new draft with the same text and audience. */
  duplicate: oc.input(byId).output(announcementSchema),
  /** Deletes a draft or a scheduled one; a sent one is CONFLICT. */
  remove: oc.input(byId).output(z.object({ removed: z.literal(true) })),
  /**
   * Archives a sent one: it leaves every device's inbox and the default
   * list, and stays on record. Already archived returns it unchanged; a
   * draft or scheduled one is CONFLICT (remove it instead).
   */
  archive: oc.input(byId).output(announcementSchema),
  /**
   * Sends it only to the calling Admin's own devices, whatever its status,
   * and records nothing. `devices` is 0 when no device of theirs is
   * registered.
   */
  sendTest: oc.input(byId).output(z.object({ devices: z.number().int() })),
  /**
   * The app checks in on every launch and foreground with its push token,
   * language and whether Announcements are on. Ties the device to the
   * signed-in Believer, if any.
   */
  registerDevice: oc
    .input(
      z.object({
        pushToken,
        platform: z.enum(["ios", "android"]),
        language: announcementLanguageSchema,
        enabled: z.boolean(),
      })
    )
    .output(z.object({ registered: z.literal(true) })),
  /** What this device received, newest first. Empty for an unknown token. */
  inbox: oc
    .input(z.object({ pushToken }))
    .output(z.object({ announcements: z.array(receivedAnnouncement) })),
};
