import {
  gatheringFieldsSchema,
  gatheringSchema,
  speakerSchema,
  withTimesInOrder,
} from "@alrisali/domain/gatherings";
import { oc } from "@orpc/contract";
import { z } from "zod";

const byId = z.object({ id: z.string().min(1) });

/** A Gathering as an Admin edits it: a new one has no id yet. */
export const gatheringDraftSchema = withTimesInOrder(
  gatheringFieldsSchema.extend({ id: z.string().min(1).optional() })
);

export type GatheringDraft = z.infer<typeof gatheringDraftSchema>;

/** A Speaker as an Admin edits it: a new one has no id yet. */
export const speakerDraftSchema = speakerSchema.extend({
  id: z.string().min(1).optional(),
});

export type SpeakerDraft = z.infer<typeof speakerDraftSchema>;

/**
 * Admins publish Gatherings and Speakers to the content database; devices
 * read them from their replica, so these are Admins only. A Speaker's photo
 * is uploaded first (`createUpload`, purpose `speaker-photo`).
 */
export const gatheringsContract = {
  /** Every Gathering, inactive ones too, and every Speaker. */
  list: oc.output(
    z.object({
      gatherings: z.array(gatheringSchema),
      speakers: z.array(speakerSchema),
    })
  ),
  /** Creates or updates; BAD_REQUEST for a Speaker that does not exist. */
  save: oc.input(gatheringDraftSchema).output(gatheringSchema),
  remove: oc.input(byId).output(byId),
  speakers: {
    /** Creates or updates; the photo must be an uploaded `speaker-photo`. */
    save: oc.input(speakerDraftSchema).output(speakerSchema),
    /** CONFLICT while a Gathering still names the Speaker. */
    remove: oc.input(byId).output(byId),
  },
};
