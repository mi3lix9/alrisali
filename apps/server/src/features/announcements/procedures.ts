import { createAnnouncementsRepository } from "@alrisali/db-content/announcements";
import type { AnnouncementsRepository } from "@alrisali/db-content/announcements";
import { missingLanguages } from "@alrisali/domain/announcements";
import type { Announcement } from "@alrisali/domain/announcements";
import { ORPCError } from "@orpc/server";

import type { Context } from "@/context";
import { admin, os } from "@/shared/lib/orpc";

import { deliverDueAnnouncements, sendTestAnnouncement } from "./deliver";
import type { DeliveryServices } from "./deliver";
import { createPushDevices } from "./devices";

/** How many Announcements a device's inbox shows. */
const INBOX_LIMIT = 100;

const repository = async ({
  content,
}: Pick<Context, "content">): Promise<AnnouncementsRepository> =>
  createAnnouncementsRepository(await content.db());

/** The Announcements, devices and push transport behind a request. */
export const deliveryServices = async (
  context: Pick<Context, "content" | "db" | "push">
): Promise<DeliveryServices> => ({
  announcements: await repository(context),
  devices: createPushDevices(context.db),
  push: context.push,
});

const existing = async (
  announcements: AnnouncementsRepository,
  id: string
): Promise<Announcement> => {
  const found = await announcements.find(id);
  if (!found) {
    throw new ORPCError("NOT_FOUND", { message: "No such Announcement" });
  }
  return found;
};

/** Why `changed` is null: absent (404) or already sent (409). */
const refusal = async (
  announcements: AnnouncementsRepository,
  id: string
): Promise<never> => {
  await existing(announcements, id);
  throw new ORPCError("CONFLICT", {
    message: "A sent Announcement can no longer change",
  });
};

const changed = (
  announcements: AnnouncementsRepository,
  id: string,
  result: Announcement | null
): Promise<Announcement> =>
  result ? Promise.resolve(result) : refusal(announcements, id);

const assertPublishable = (announcement: Announcement) => {
  const missing = missingLanguages(announcement.text);
  if (missing.length > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Write the title and body in every language first (missing: ${missing.join(", ")})`,
    });
  }
};

const list = admin.announcements.list.handler(async ({ context }) => {
  const announcements = await repository(context);
  return { announcements: await announcements.list() };
});

const get = admin.announcements.get.handler(
  async ({ context, input: { id } }) => existing(await repository(context), id)
);

const create = admin.announcements.create.handler(
  async ({ context, input }) => {
    const announcements = await repository(context);
    return announcements.create(input, Date.now());
  }
);

const update = admin.announcements.update.handler(
  async ({ context, input: { id, ...draft } }) => {
    const announcements = await repository(context);
    return changed(
      announcements,
      id,
      await announcements.update(id, draft, Date.now())
    );
  }
);

const schedule = admin.announcements.schedule.handler(
  async ({ context, input: { id, at } }) => {
    const announcements = await repository(context);
    assertPublishable(await existing(announcements, id));
    return changed(
      announcements,
      id,
      await announcements.schedule(id, at, Date.now())
    );
  }
);

const unschedule = admin.announcements.unschedule.handler(
  async ({ context, input: { id } }) => {
    const announcements = await repository(context);
    const result = await announcements.unschedule(id, Date.now());
    if (result) {
      return result;
    }
    await existing(announcements, id);
    throw new ORPCError("CONFLICT", {
      message: "Only a scheduled Announcement can go back to a draft",
    });
  }
);

const publishNow = admin.announcements.publishNow.handler(
  async ({ context, input: { id } }) => {
    const services = await deliveryServices(context);
    const { announcements } = services;
    assertPublishable(await existing(announcements, id));
    const now = Date.now();
    await changed(
      announcements,
      id,
      await announcements.schedule(id, now, now)
    );
    const counts = await deliverDueAnnouncements(services, now);
    return {
      announcement: await existing(announcements, id),
      devices: counts.get(id) ?? 0,
    };
  }
);

const duplicate = admin.announcements.duplicate.handler(
  async ({ context, input: { id } }) => {
    const announcements = await repository(context);
    const { text, audience } = await existing(announcements, id);
    return announcements.create({ text, audience }, Date.now());
  }
);

const remove = admin.announcements.remove.handler(
  async ({ context, input: { id } }) => {
    const announcements = await repository(context);
    if (!(await announcements.remove(id))) {
      await refusal(announcements, id);
    }
    return { removed: true as const };
  }
);

const sendTest = admin.announcements.sendTest.handler(
  async ({ context, input: { id } }) => {
    const services = await deliveryServices(context);
    const announcement = await existing(services.announcements, id);
    assertPublishable(announcement);
    return {
      devices: await sendTestAnnouncement(
        services,
        announcement,
        context.session.user.id
      ),
    };
  }
);

/** Guests too: the device is tied to whoever is signed in on it, if anyone. */
const registerDevice = os.announcements.registerDevice.handler(
  async ({ context, input }) => {
    await createPushDevices(context.db).register({
      token: input.pushToken,
      userId: context.session?.user.id ?? null,
      platform: input.platform,
      language: input.language,
      enabled: input.enabled,
      now: Date.now(),
    });
    return { registered: true as const };
  }
);

const inbox = os.announcements.inbox.handler(
  async ({ context, input: { pushToken } }) => {
    const received = await createPushDevices(context.db).inbox(
      pushToken,
      INBOX_LIMIT
    );
    const announcements = await repository(context);
    const found = await announcements.findMany(
      received.map(({ announcementId }) => announcementId)
    );
    const texts = new Map(
      found.map((announcement) => [announcement.id, announcement.text])
    );
    return {
      announcements: received.flatMap(
        ({ announcementId, language, sentAt }) => {
          const text = texts.get(announcementId)?.[language];
          return text ? [{ id: announcementId, ...text, sentAt }] : [];
        }
      ),
    };
  }
);

export const announcementsRouter = {
  list,
  get,
  create,
  update,
  schedule,
  unschedule,
  publishNow,
  duplicate,
  remove,
  sendTest,
  registerDevice,
  inbox,
};
