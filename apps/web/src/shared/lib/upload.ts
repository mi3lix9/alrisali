import { UPLOAD_RULES } from "@alrisali/api/shared";
import type { UploadPurpose } from "@alrisali/api/shared";

import { client } from "@/shared/lib/orpc";

const MEBIBYTE = 1024 * 1024;

const describeSize = (bytes: number): string =>
  `${(bytes / MEBIBYTE).toFixed(1).replace(/\.0$/u, "")} MiB`;

/**
 * Why `file` cannot be uploaded for `purpose`, or null when it can: the same
 * type and size rules the server enforces, checked before asking it.
 */
const uploadProblem = (
  purpose: UploadPurpose,
  file: Pick<File, "name" | "size" | "type">
): string | null => {
  const rules = UPLOAD_RULES[purpose];
  const allowed = Object.keys(rules.contentTypes);
  if (!allowed.includes(file.type)) {
    const extensions = Object.values(rules.contentTypes).join(", ");
    return `${file.name} is not an accepted file type (use ${extensions}).`;
  }
  if (file.size === 0) {
    return `${file.name} is empty.`;
  }
  if (file.size > rules.maxBytes) {
    return `${file.name} is ${describeSize(file.size)}; the limit is ${describeSize(rules.maxBytes)}.`;
  }
  return null;
};

/** The content types a file input for `purpose` should accept. */
export const acceptedTypes = (purpose: UploadPurpose): string =>
  Object.keys(UPLOAD_RULES[purpose].contentTypes).join(",");

/** What `purpose` accepts, for a hint under its file input. */
export const describeUploadRules = (purpose: UploadPurpose): string => {
  const rules = UPLOAD_RULES[purpose];
  const extensions = Object.values(rules.contentTypes).join(", ");
  return `${extensions.toUpperCase()}, up to ${describeSize(rules.maxBytes)}.`;
};

/**
 * Uploads `file` to the files bucket and returns its key, which the content
 * that uses the file then saves. Throws an Error with a readable message when
 * the file breaks the purpose's rules or the upload fails.
 */
export const uploadFile = async (
  purpose: UploadPurpose,
  file: File
): Promise<string> => {
  const problem = uploadProblem(purpose, file);
  if (problem) {
    throw new Error(problem);
  }
  const upload = await client.createUpload({
    purpose,
    contentType: file.type,
    size: file.size,
  });
  let response: Response;
  try {
    response = await fetch(upload.url, {
      method: upload.method,
      headers: upload.headers,
      body: file,
    });
  } catch (error) {
    throw new Error(
      `Could not upload ${file.name}: the storage is unreachable.`,
      {
        cause: error,
      }
    );
  }
  if (!response.ok) {
    const status = `${response.status} ${response.statusText}`.trim();
    throw new Error(
      `Could not upload ${file.name}: storage answered ${status}.`
    );
  }
  return upload.key;
};
