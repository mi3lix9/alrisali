import { oc } from "@orpc/contract";
import { z } from "zod";

const MEBIBYTE = 1024 * 1024;

/**
 * What Admins may upload to the files bucket, by purpose: the file types
 * each takes and its largest size. A purpose is also the folder its files'
 * keys start with. Add a purpose here for each new kind of file.
 */
export const UPLOAD_RULES = {
  "speaker-photo": {
    contentTypes: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    },
    maxBytes: 5 * MEBIBYTE,
  },
} as const satisfies Record<
  string,
  { contentTypes: Record<string, string>; maxBytes: number }
>;

export type UploadPurpose = keyof typeof UPLOAD_RULES;

const UPLOAD_PURPOSES = Object.keys(UPLOAD_RULES) as [
  UploadPurpose,
  ...UploadPurpose[],
];

/** Where the server serves an uploaded file from, under its own origin. */
export const FILES_PATH = "/files";

/** The address an app loads an uploaded file from, by its key. */
export const fileUrl = (serverUrl: string, key: string): string =>
  `${serverUrl.replace(/\/$/u, "")}${FILES_PATH}/${key}`;

export const uploadRequestSchema = z
  .object({
    purpose: z.enum(UPLOAD_PURPOSES),
    contentType: z.string().min(1),
    /** In bytes; the bucket refuses a file of any other size. */
    size: z.number().int().positive(),
  })
  .superRefine(({ purpose, contentType, size }, context) => {
    const rules = UPLOAD_RULES[purpose];
    if (!Object.hasOwn(rules.contentTypes, contentType)) {
      context.addIssue({
        code: "custom",
        path: ["contentType"],
        message: `A ${purpose} must be one of ${Object.keys(rules.contentTypes).join(", ")}`,
      });
    }
    if (size > rules.maxBytes) {
      context.addIssue({
        code: "custom",
        path: ["size"],
        message: `A ${purpose} must be at most ${rules.maxBytes / MEBIBYTE} MiB`,
      });
    }
  });

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

/**
 * A presigned upload: PUT the file's bytes to `url` with exactly `headers`
 * before `expiresAt` (epoch milliseconds), then save `key` with the content
 * that uses the file.
 */
export const uploadSchema = z.object({
  key: z.string().min(1),
  url: z.url(),
  method: z.literal("PUT"),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.number().int(),
});

export type Upload = z.infer<typeof uploadSchema>;

/** Admins only: the old app's upload route needed no login at all. */
export const createUploadContract = oc
  .input(uploadRequestSchema)
  .output(uploadSchema);
