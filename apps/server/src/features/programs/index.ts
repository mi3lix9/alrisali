import { createProgramsRepository } from "@alrisali/db-content/programs";

import type { Context } from "@/context";
import { admin } from "@/shared/lib/orpc";

const programsOf = async ({ content }: Pick<Context, "content">) =>
  createProgramsRepository(await content.db());

const list = admin.programs.list.handler(async ({ context }) => {
  const programs = await programsOf(context);
  return programs.list({ includeInactive: true });
});

const get = admin.programs.get.handler(async ({ context, input: { id } }) => {
  const programs = await programsOf(context);
  return programs.get(id);
});

/** Devices show the change after their next pull. */
const save = admin.programs.save.handler(async ({ context, input }) => {
  const programs = await programsOf(context);
  await programs.save(input);
  return input;
});

const remove = admin.programs.remove.handler(
  async ({ context, input: { id } }) => {
    const programs = await programsOf(context);
    await programs.remove(id);
    return {};
  }
);

const reorder = admin.programs.reorder.handler(
  async ({ context, input: { ids } }) => {
    const programs = await programsOf(context);
    await programs.reorder(ids);
    return {};
  }
);

export const programsRouter = { list, get, save, remove, reorder };
