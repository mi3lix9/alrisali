// Deploy step: lets the admin web (CORS_ORIGIN) PUT presigned uploads to the
// files bucket straight from the browser. Idempotent.
import { ENV } from "@/env.server";
import { createS3FileBucket, readFilesConfig } from "@/shared/lib/file-bucket";

await createS3FileBucket(readFilesConfig(ENV)).allowBrowserUploads([
  ENV.CORS_ORIGIN,
]);
console.log("The files bucket accepts uploads from the admin web.");
