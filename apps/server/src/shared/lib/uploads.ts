import { randomUUID } from "node:crypto";

import { FILES_PATH, UPLOAD_RULES } from "@alrisali/api/shared";
import type { UploadPurpose } from "@alrisali/api/shared";
import { fileKeySchema } from "@alrisali/domain/shared";
import type { Hono } from "hono";

import type { FileBucket } from "./file-bucket";
import { DOWNLOAD_EXPIRY_SECONDS } from "./file-bucket";
import { admin } from "./orpc";

/** Whether `key` names a file uploaded for `purpose`. */
export const isUploadFor = (purpose: UploadPurpose, key: string): boolean =>
  key.startsWith(`${purpose}/`) && fileKeySchema.safeParse(key).success;

/**
 * Admins only: a fresh key under the purpose's folder and a presigned PUT
 * for it, bound to the declared type and size.
 */
export const createUpload = admin.createUpload.handler(
  async ({ context, input: { purpose, contentType, size } }) => {
    const rules = UPLOAD_RULES[purpose];
    const extension =
      rules.contentTypes[contentType as keyof typeof rules.contentTypes];
    const key = `${purpose}/${randomUUID()}.${extension}`;
    const upload = await context.files.presignUpload({
      key,
      contentType,
      size,
    });
    return { key, method: "PUT" as const, ...upload };
  }
);

/** Browsers and apps may reuse a redirect until shortly before it expires. */
const REDIRECT_MAX_AGE_SECONDS = DOWNLOAD_EXPIRY_SECONDS / 2;

/**
 * `GET /files/<key>`: redirects to a short-lived URL of the published file
 * (the bucket is private). Anyone may read what Admins published.
 */
export const mountFiles = (app: Hono, files: FileBucket): void => {
  app.get(`${FILES_PATH}/*`, async (c) => {
    const key = c.req.path.slice(FILES_PATH.length + 1);
    if (!fileKeySchema.safeParse(key).success) {
      return c.notFound();
    }
    c.header("cache-control", `public, max-age=${REDIRECT_MAX_AGE_SECONDS}`);
    return c.redirect(await files.presignDownload(key), 302);
  });
};
