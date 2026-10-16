import { randomUUID } from "node:crypto";

import { createGatheringsRepository } from "@alrisali/db-content/gatherings";
import { ORPCError } from "@orpc/server";

import type { Context } from "@/context";
import { admin } from "@/shared/lib/orpc";
import { isUploadFor } from "@/shared/lib/uploads";

const repository = async ({ content }: Pick<Context, "content">) =>
  createGatheringsRepository(await content.db());

const list = admin.gatherings.list.handler(async ({ context }) => {
  const gatherings = await repository(context);
  return {
    gatherings: await gatherings.gatherings(),
    speakers: await gatherings.speakers(),
  };
});

/** Devices show the change after their next pull. */
const save = admin.gatherings.save.handler(async ({ context, input }) => {
  const gatherings = await repository(context);
  if (input.speakerId && !(await gatherings.speaker(input.speakerId))) {
    throw new ORPCError("BAD_REQUEST", {
      message: `No Speaker ${input.speakerId}`,
    });
  }
  const gathering = { ...input, id: input.id ?? randomUUID() };
  await gatherings.saveGathering(gathering);
  return gathering;
});

const remove = admin.gatherings.remove.handler(
  async ({ context, input: { id } }) => {
    const gatherings = await repository(context);
    await gatherings.deleteGathering(id);
    return { id };
  }
);

const saveSpeaker = admin.gatherings.speakers.save.handler(
  async ({ context, input }) => {
    if (input.photoKey && !isUploadFor("speaker-photo", input.photoKey)) {
      throw new ORPCError("BAD_REQUEST", {
        message: "The photo must be an uploaded speaker-photo",
      });
    }
    const gatherings = await repository(context);
    const speaker = { ...input, id: input.id ?? randomUUID() };
    await gatherings.saveSpeaker(speaker);
    return speaker;
  }
);

/** Refused while Gatherings name the Speaker: they would lose their Speaker. */
const removeSpeaker = admin.gatherings.speakers.remove.handler(
  async ({ context, input: { id } }) => {
    const gatherings = await repository(context);
    const named = await gatherings.gatheringsOfSpeaker(id);
    if (named > 0) {
      throw new ORPCError("CONFLICT", {
        message: `${named} Gathering${named === 1 ? "" : "s"} still name this Speaker`,
      });
    }
    await gatherings.deleteSpeaker(id);
    return { id };
  }
);

export const gatheringsRouter = {
  list,
  save,
  remove,
  speakers: { save: saveSpeaker, remove: removeSpeaker },
};
