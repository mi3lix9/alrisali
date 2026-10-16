import { randomUUID } from "node:crypto";

import { createAdhansRepository } from "@alrisali/db-content/shared";
import { ADHAN_UPLOAD_PURPOSES } from "@alrisali/domain/shared";
import type { AdhanCatalogueEntry } from "@alrisali/domain/shared";
import { ORPCError } from "@orpc/server";

import type { Context } from "@/context";
import { admin } from "@/shared/lib/orpc";
import { isUploadFor } from "@/shared/lib/uploads";

const adhansOf = async ({ content }: Pick<Context, "content">) =>
  createAdhansRepository(await content.db());

const list = admin.adhans.list.handler(async ({ context }) => {
  const adhans = await adhansOf(context);
  return { adhans: await adhans.list() };
});

/** Devices list the voice after their next pull. */
const save = admin.adhans.save.handler(async ({ context, input }) => {
  for (const cut of ["full", "takbir"] as const) {
    if (!isUploadFor(ADHAN_UPLOAD_PURPOSES[cut], input[cut].key)) {
      throw new ORPCError("BAD_REQUEST", {
        message: `${input[cut].key} was not uploaded as ${ADHAN_UPLOAD_PURPOSES[cut]}`,
      });
    }
  }
  const entry: AdhanCatalogueEntry = { ...input, id: input.id ?? randomUUID() };
  const adhans = await adhansOf(context);
  await adhans.save(entry);
  return entry;
});

const remove = admin.adhans.remove.handler(
  async ({ context, input: { id } }) => {
    const adhans = await adhansOf(context);
    await adhans.remove(id);
    return { id };
  }
);

const reorder = admin.adhans.reorder.handler(
  async ({ context, input: { ids } }) => {
    const adhans = await adhansOf(context);
    await adhans.reorder(ids);
    return {};
  }
);

export const adhansRouter = { list, save, remove, reorder };
