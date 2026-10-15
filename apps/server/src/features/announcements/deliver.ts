import type { AnnouncementsRepository } from "@alrisali/db-content/announcements";
import { inAudience } from "@alrisali/domain/announcements";
import type { Announcement } from "@alrisali/domain/announcements";

import { reportServerError } from "@/shared/lib/monitoring";
import type { PushTransport } from "@/shared/lib/push-transport";

import type { Delivery, PushDevices, PushRecipient } from "./devices";

/** Expo's error for a token whose app was uninstalled or lost permission. */
const DEAD_TOKEN = "DeviceNotRegistered";

/** Expo has receipts ready by then (it keeps them for a day). */
export const RECEIPT_DELAY_MS = 15 * 60 * 1000;
const RECEIPT_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface DeliveryServices {
  announcements: AnnouncementsRepository;
  devices: PushDevices;
  push: PushTransport;
}

interface Sent {
  /** The devices that accepted it (Expo answered with a ticket). */
  accepted: { recipient: PushRecipient; ticketId: string }[];
}

/**
 * Sends one Announcement to these devices, each in its own language, and
 * prunes the devices Expo calls dead.
 */
const send = async (
  { devices, push }: Pick<DeliveryServices, "devices" | "push">,
  { id, text }: Pick<Announcement, "id" | "text">,
  recipients: readonly PushRecipient[]
): Promise<Sent> => {
  if (recipients.length === 0) {
    return { accepted: [] };
  }
  const tickets = await push.send(
    recipients.map(({ token, language }) => ({
      to: token,
      title: text[language].title,
      body: text[language].body,
      data: { announcementId: id },
    }))
  );
  const accepted: Sent["accepted"] = [];
  const dead: string[] = [];
  for (const [index, recipient] of recipients.entries()) {
    const ticket = tickets[index];
    if (ticket?.status === "ok") {
      accepted.push({ recipient, ticketId: ticket.id });
    } else if (ticket?.error === DEAD_TOKEN) {
      dead.push(recipient.id);
    } else if (ticket) {
      reportServerError(
        new Error(`Expo Push refused an Announcement: ${ticket.message}`)
      );
    }
  }
  await devices.prune(dead);
  return { accepted };
};

/**
 * Sends every scheduled Announcement that is due to its audience and records
 * each device's delivery (its inbox). Returns how many devices each one went
 * to, by Announcement id. An Announcement is claimed (marked sent) before it
 * is sent, so it never goes out twice; a crash midway leaves some devices
 * without it.
 */
export const deliverDueAnnouncements = async (
  services: DeliveryServices,
  now: number
): Promise<Map<string, number>> => {
  const due = await services.announcements.claimDue(now);
  const counts = new Map<string, number>();
  if (due.length === 0) {
    return counts;
  }
  const everyone = await services.devices.enabled();
  for (const announcement of due) {
    const recipients = everyone.filter((recipient) =>
      inAudience(announcement.audience, recipient, now)
    );
    try {
      // oxlint-disable-next-line no-await-in-loop -- one Announcement at a time keeps Expo's rate limit
      const { accepted } = await send(services, announcement, recipients);
      const deliveries: Delivery[] = accepted.map(
        ({ recipient, ticketId }) => ({
          announcementId: announcement.id,
          deviceId: recipient.id,
          language: recipient.language,
          ticketId,
        })
      );
      // oxlint-disable-next-line no-await-in-loop -- recorded with its own sending
      await services.devices.recordDeliveries(deliveries, now);
      counts.set(announcement.id, accepted.length);
    } catch (error) {
      reportServerError(
        new Error(`Announcement ${announcement.id} was not sent`, {
          cause: error,
        })
      );
      counts.set(announcement.id, 0);
    }
  }
  return counts;
};

/**
 * Sends an Announcement to one Admin's own devices only, whatever its status
 * or theirs, and records nothing. Returns how many devices took it.
 */
export const sendTestAnnouncement = async (
  services: Pick<DeliveryServices, "devices" | "push">,
  announcement: Pick<Announcement, "id" | "text">,
  userId: string
): Promise<number> => {
  const { accepted } = await send(
    services,
    announcement,
    await services.devices.ofUser(userId)
  );
  return accepted.length;
};

/**
 * Reads the Expo receipts of deliveries sent at least `RECEIPT_DELAY_MS`
 * ago and prunes the devices whose token turned out dead. A receipt not
 * ready yet is asked for again next time, until Expo drops it after a day.
 */
export const checkReceipts = async (
  { devices, push }: Pick<DeliveryServices, "devices" | "push">,
  now: number
): Promise<void> => {
  const pending = await devices.pendingReceipts(now - RECEIPT_DELAY_MS);
  if (pending.length === 0) {
    return;
  }
  const receipts = await push.receipts(pending.map(({ ticketId }) => ticketId));
  const dead = pending.flatMap(({ ticketId, deviceId }) => {
    const receipt = receipts.get(ticketId);
    return receipt?.status === "error" && receipt.error === DEAD_TOKEN
      ? [deviceId]
      : [];
  });
  await devices.prune(dead);
  const expired = await devices.pendingReceipts(now - RECEIPT_EXPIRY_MS);
  await devices.clearTickets([
    ...receipts.keys(),
    ...expired.map(({ ticketId }) => ticketId),
  ]);
};
