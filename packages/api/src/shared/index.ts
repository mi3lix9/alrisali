import { oc } from "@orpc/contract";
import { z } from "zod";

import { createUploadContract } from "./uploads";

export {
  FILES_PATH,
  fileUrl,
  UPLOAD_RULES,
  uploadRequestSchema,
  uploadSchema,
} from "./uploads";
export type { Upload, UploadPurpose, UploadRequest } from "./uploads";

/** Procedures no single feature owns. */
export const sharedContract = {
  healthCheck: oc.output(z.literal("OK")),
  /**
   * Where the shared content database is and a short-lived read-only token
   * for it (ADR-0001): every device, Guests included, keeps a pull-only
   * replica. `expiresAt` is in epoch milliseconds.
   */
  contentReplica: oc.output(
    z.object({
      url: z.url(),
      token: z.string().min(1),
      expiresAt: z.number().int(),
    })
  ),
  /**
   * A presigned upload of one file to the files bucket (Speaker photos,
   * Slides, Library Assets). Admins only.
   */
  createUpload: createUploadContract,
};
