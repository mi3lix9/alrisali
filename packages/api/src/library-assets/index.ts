import {
  libraryAssetFieldsSchema,
  withFileOfItsKind,
} from "@alrisali/domain/library-assets";
import { oc } from "@orpc/contract";
import { z } from "zod";

const byId = z.object({ id: z.string().min(1) });

/**
 * A Library Asset as Admins manage it: published or not. Devices receive only
 * published ones, without the flag.
 */
export const managedLibraryAssetSchema = withFileOfItsKind(
  libraryAssetFieldsSchema.extend({ published: z.boolean() })
);

export type ManagedLibraryAsset = z.infer<typeof managedLibraryAssetSchema>;

/** A Library Asset as an Admin edits it: a new one has no id yet. */
export const libraryAssetDraftSchema = withFileOfItsKind(
  libraryAssetFieldsSchema.extend({
    id: z.string().min(1).optional(),
    published: z.boolean(),
  })
);

export type LibraryAssetDraft = z.infer<typeof libraryAssetDraftSchema>;

/**
 * Admins upload Library Assets (`createUpload`, purpose `library-asset`, and
 * `library-cover` for a cover) and publish them. Unpublished ones stay on the
 * server: only published ones are copied to the content database devices
 * pull, and the server serves their files to anyone only while published.
 */
export const libraryAssetsContract = {
  /**
   * Every Library Asset, unpublished ones too, with a short-lived URL for
   * each of their files and covers (by key) so Admins can preview them.
   */
  list: oc.output(
    z.object({
      assets: z.array(managedLibraryAssetSchema),
      previews: z.record(z.string(), z.url()),
    })
  ),
  /**
   * Creates or updates. BAD_REQUEST for a structured-text file that is not
   * in the structured-text format, or a file that was never uploaded.
   */
  save: oc.input(libraryAssetDraftSchema).output(managedLibraryAssetSchema),
  /** NOT_FOUND for a Library Asset that is gone. */
  setPublished: oc
    .input(byId.extend({ published: z.boolean() }))
    .output(managedLibraryAssetSchema),
  remove: oc.input(byId).output(byId),
};
