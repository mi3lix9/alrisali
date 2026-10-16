import { createGlobalSettingsRepository } from "@alrisali/db-content/shared";

import type { Context } from "@/context";
import { admin } from "@/shared/lib/orpc";

const globalSettings = async ({ content }: Pick<Context, "content">) =>
  createGlobalSettingsRepository(await content.db());

const get = admin.hijriAdjustment.get.handler(async ({ context }) => {
  const settings = await globalSettings(context);
  return { adjustment: await settings.hijriAdjustment() };
});

/** Devices show the new Hijri Date after their next pull. */
const set = admin.hijriAdjustment.set.handler(
  async ({ context, input: { adjustment } }) => {
    const settings = await globalSettings(context);
    await settings.setHijriAdjustment(adjustment);
    return { adjustment };
  }
);

export const hijriAdjustmentRouter = { get, set };
