import type { Database } from "@alrisali/db-server";
import {
  announcementDelivery,
  pushDevice,
} from "@alrisali/db-server/schema/announcements";
import { user } from "@alrisali/db-server/schema/auth";
import { ANNOUNCEMENT_LANGUAGES } from "@alrisali/domain/announcements";
import type { AnnouncementLanguage } from "@alrisali/domain/announcements";
import { and, desc, eq, inArray, isNotNull, lte } from "drizzle-orm";

/** A device an Announcement can go to. */
export interface PushRecipient {
  id: string;
  token: string;
  language: AnnouncementLanguage;
  lastSeenAt: number;
  joinedAt: number;
}

export interface DeviceRegistration {
  token: string;
  userId: string | null;
  platform: string;
  language: AnnouncementLanguage;
  enabled: boolean;
  now: number;
}

/** A delivery waiting for its Expo receipt. */
export interface PendingReceipt {
  ticketId: string;
  deviceId: string;
}

/** An Announcement sent to a device, with Expo's ticket for it. */
export interface Delivery {
  announcementId: string;
  deviceId: string;
  language: AnnouncementLanguage;
  ticketId: string;
}

/** One entry of a device's inbox. */
export interface InboxEntry {
  announcementId: string;
  language: AnnouncementLanguage;
  sentAt: number;
}

/** Push devices and what was delivered to them, in the server database. */
export interface PushDevices {
  /** Creates the device on its first check-in, refreshes it afterwards. */
  register: (registration: DeviceRegistration) => Promise<void>;
  /** Every device with Announcements on. */
  enabled: () => Promise<PushRecipient[]>;
  /** A Believer's own devices, whether Announcements are on or off. */
  ofUser: (userId: string) => Promise<PushRecipient[]>;
  /** Forgets dead devices, and with them their inbox. */
  prune: (deviceIds: readonly string[]) => Promise<void>;
  recordDeliveries: (
    deliveries: readonly Delivery[],
    now: number
  ) => Promise<void>;
  /** Deliveries sent by `sentBefore` whose receipt is not checked yet. */
  pendingReceipts: (sentBefore: number) => Promise<PendingReceipt[]>;
  /** Marks these receipts checked. */
  clearTickets: (ticketIds: readonly string[]) => Promise<void>;
  /** What the device with this token received, newest first. */
  inbox: (token: string, limit: number) => Promise<InboxEntry[]>;
}

const languageOf = (stored: string): AnnouncementLanguage =>
  ANNOUNCEMENT_LANGUAGES.find((language) => language === stored) ?? "ar";

const recipientColumns = {
  id: pushDevice.id,
  token: pushDevice.token,
  language: pushDevice.language,
  lastSeenAt: pushDevice.lastSeenAt,
  createdAt: pushDevice.createdAt,
  userCreatedAt: user.createdAt,
};

const toRecipient = (row: {
  id: string;
  token: string;
  language: string;
  lastSeenAt: Date;
  createdAt: Date;
  userCreatedAt: Date | null;
}): PushRecipient => ({
  id: row.id,
  token: row.token,
  language: languageOf(row.language),
  lastSeenAt: row.lastSeenAt.getTime(),
  // A Believer's new phone does not make them a new Believer.
  joinedAt: Math.min(
    row.createdAt.getTime(),
    row.userCreatedAt?.getTime() ?? Number.POSITIVE_INFINITY
  ),
});

export const createPushDevices = (db: Database): PushDevices => ({
  /** Creates the device on its first check-in, refreshes it afterwards. */
  register: async ({ now, ...device }: DeviceRegistration) => {
    const seen = new Date(now);
    await db
      .insert(pushDevice)
      .values({
        id: crypto.randomUUID(),
        ...device,
        createdAt: seen,
        lastSeenAt: seen,
      })
      .onConflictDoUpdate({
        target: pushDevice.token,
        set: {
          userId: device.userId,
          platform: device.platform,
          language: device.language,
          enabled: device.enabled,
          lastSeenAt: seen,
        },
      });
  },

  /** Every device with Announcements on. */
  enabled: async (): Promise<PushRecipient[]> => {
    const rows = await db
      .select(recipientColumns)
      .from(pushDevice)
      .leftJoin(user, eq(user.id, pushDevice.userId))
      .where(eq(pushDevice.enabled, true));
    return rows.map(toRecipient);
  },

  /** A Believer's own devices, whether Announcements are on or off. */
  ofUser: async (userId: string): Promise<PushRecipient[]> => {
    const rows = await db
      .select(recipientColumns)
      .from(pushDevice)
      .leftJoin(user, eq(user.id, pushDevice.userId))
      .where(eq(pushDevice.userId, userId));
    return rows.map(toRecipient);
  },

  /** Forgets dead devices, and with them their inbox. */
  prune: async (deviceIds: readonly string[]) => {
    if (deviceIds.length === 0) {
      return;
    }
    const ids = [...deviceIds];
    await db
      .delete(announcementDelivery)
      .where(inArray(announcementDelivery.deviceId, ids));
    await db.delete(pushDevice).where(inArray(pushDevice.id, ids));
  },

  recordDeliveries: async (
    deliveries: readonly {
      announcementId: string;
      deviceId: string;
      language: AnnouncementLanguage;
      ticketId: string;
    }[],
    now: number
  ) => {
    if (deliveries.length === 0) {
      return;
    }
    await db
      .insert(announcementDelivery)
      .values(
        deliveries.map((delivery) => ({ ...delivery, sentAt: new Date(now) }))
      )
      .onConflictDoNothing();
  },

  /** Deliveries sent by `sentBefore` whose receipt is not checked yet. */
  pendingReceipts: async (sentBefore: number): Promise<PendingReceipt[]> => {
    const rows = await db
      .select({
        ticketId: announcementDelivery.ticketId,
        deviceId: announcementDelivery.deviceId,
      })
      .from(announcementDelivery)
      .where(
        and(
          isNotNull(announcementDelivery.ticketId),
          lte(announcementDelivery.sentAt, new Date(sentBefore))
        )
      );
    return rows.flatMap(({ ticketId, deviceId }) =>
      ticketId ? [{ ticketId, deviceId }] : []
    );
  },

  /** Marks these receipts checked. */
  clearTickets: async (ticketIds: readonly string[]) => {
    if (ticketIds.length === 0) {
      return;
    }
    await db
      .update(announcementDelivery)
      .set({ ticketId: null })
      .where(inArray(announcementDelivery.ticketId, [...ticketIds]));
  },

  /** What the device with this token received, newest first. */
  inbox: async (token: string, limit: number) => {
    const rows = await db
      .select({
        announcementId: announcementDelivery.announcementId,
        language: announcementDelivery.language,
        sentAt: announcementDelivery.sentAt,
      })
      .from(announcementDelivery)
      .innerJoin(pushDevice, eq(pushDevice.id, announcementDelivery.deviceId))
      .where(eq(pushDevice.token, token))
      .orderBy(desc(announcementDelivery.sentAt))
      .limit(limit);
    return rows.map((row) => ({
      announcementId: row.announcementId,
      language: languageOf(row.language),
      sentAt: row.sentAt.getTime(),
    }));
  },
});
