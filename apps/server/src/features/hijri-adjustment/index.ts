import { createGlobalSettingsRepository } from "@alrisali/db-content/shared";
import {
  defaultHijriConverter,
  forcedHijriDateProblem,
  HIJRI_ADJUSTMENT_LIMIT,
} from "@alrisali/domain/shared";
import { ORPCError } from "@orpc/server";

import type { Context } from "@/context";
import { admin } from "@/shared/lib/orpc";

// Forced dates are checked against Umm al-Qura through the server's Intl.
const converter = defaultHijriConverter();

const PROBLEMS = {
  "missing-day":
    "That month has fewer days by the computed calendar; publish the 1st of the next month instead",
  "too-far": `The forced date is more than ${HIJRI_ADJUSTMENT_LIMIT} days from the computed one`,
} as const;

const globalSettings = async ({ content }: Pick<Context, "content">) =>
  createGlobalSettingsRepository(await content.db());

const get = admin.hijriAdjustment.get.handler(async ({ context }) => {
  const settings = await globalSettings(context);
  return settings.hijriAdjustment();
});

/** Devices show the new Hijri Date after their next pull. */
const set = admin.hijriAdjustment.set.handler(async ({ context, input }) => {
  const problem =
    input.forced && forcedHijriDateProblem({ forced: input.forced, converter });
  if (problem) {
    throw new ORPCError("BAD_REQUEST", { message: PROBLEMS[problem] });
  }
  const settings = await globalSettings(context);
  await settings.setHijriAdjustment(input);
  return input;
});

export const hijriAdjustmentRouter = { get, set };
