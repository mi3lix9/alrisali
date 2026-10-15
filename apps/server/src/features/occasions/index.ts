import { randomUUID } from "node:crypto";

import { createOccasionsRepository } from "@alrisali/db-content/shared";

import type { Context } from "@/context";
import { admin } from "@/shared/lib/orpc";

const repository = async ({ content }: Pick<Context, "content">) =>
  createOccasionsRepository(await content.db());

const list = admin.occasions.list.handler(async ({ context }) => {
  const occasions = await repository(context);
  return { occasions: await occasions.list() };
});

/** Devices show a new Occasion after their next pull. */
const create = admin.occasions.create.handler(async ({ context, input }) => {
  const occasions = await repository(context);
  return occasions.create({ id: randomUUID(), ...input }, Date.now());
});

const update = admin.occasions.update.handler(async ({ context, input }) => {
  const occasions = await repository(context);
  return occasions.update(input);
});

const remove = admin.occasions.delete.handler(
  async ({ context, input: { id } }) => {
    const occasions = await repository(context);
    return { deleted: await occasions.remove(id) };
  }
);

export const occasionsRouter = { list, create, update, delete: remove };
