import {
  adhanCatalogueEntrySchema,
  adhanCatalogueFieldsSchema,
} from "@alrisali/domain/shared";
import { oc } from "@orpc/contract";
import { z } from "zod";

const byId = z.object({ id: z.string().trim().min(1) });

/** A voice as an Admin edits it: a new one has no id yet. */
export const adhanDraftSchema = adhanCatalogueFieldsSchema.extend({
  id: adhanCatalogueEntrySchema.shape.id.optional(),
});

export type AdhanDraft = z.infer<typeof adhanDraftSchema>;

/**
 * The adhan catalogue, published in the content database: devices list its
 * voices after their next pull and download the ones the Believer picks.
 * Admins only. Recordings are uploaded first (`createUpload`, purposes
 * `adhan-full` and `adhan-takbir`); a takbir must be a WAV file because iOS
 * plays notification sounds from linear PCM files, and at most 30 seconds.
 */
export const adhansContract = {
  /** Every voice, in the Admins' order. */
  list: oc.output(z.object({ adhans: z.array(adhanCatalogueEntrySchema) })),
  /**
   * Creates or rewrites a voice; a new one goes last. BAD_REQUEST for a
   * recording not uploaded as its cut, and for an id that is not a voice's.
   */
  save: oc.input(adhanDraftSchema).output(adhanCatalogueEntrySchema),
  /** Withdraws a voice; devices that downloaded it keep the files. */
  remove: oc.input(byId).output(byId),
  /** Orders the voices as listed. */
  reorder: oc
    .input(z.object({ ids: z.array(z.string().trim().min(1)) }))
    .output(z.object({})),
};
