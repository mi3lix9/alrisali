import { z } from "zod";

/**
 * Where a file Admins uploaded lives in the files bucket, such as a
 * Speaker's photo: `<purpose>/<uuid>.<extension>`.
 */
export const fileKeySchema = z
  .string()
  .regex(/^[a-z-]+\/[\da-f-]{36}\.[a-z\d]+$/u);
