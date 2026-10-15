import type { Database } from "@alrisali/db-server";
import {
  analyticsEvent,
  analyticsInstall,
} from "@alrisali/db-server/schema/analytics";
import type { AnalyticsBatch } from "@alrisali/domain/analytics";
import { sql } from "drizzle-orm";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Events older than this are dropped: a device offline longer lost them. */
const MAX_EVENT_AGE_MS = 30 * DAY_MS;
/** How far ahead of the server's clock a device's clock may run. */
const MAX_CLOCK_AHEAD_MS = 10 * 60 * 1000;

interface RecordBatchOptions {
  batch: AnalyticsBatch;
  /** The signed-in Believer who sent it, or null for a Guest. */
  userId: string | null;
  now: number;
}

/**
 * Stores a batch in one write: the installation's row (created, or updated
 * with the latest metadata) and every new event in the accepted time range.
 * Events whose id is already stored are skipped, so a resent batch adds
 * nothing.
 */
export const recordBatch = async (
  db: Database,
  { batch, userId, now }: RecordBatchOptions
): Promise<{ accepted: number; dropped: number }> => {
  const events = batch.events.filter(
    ({ occurredAt }) =>
      occurredAt >= now - MAX_EVENT_AGE_MS &&
      occurredAt <= now + MAX_CLOCK_AHEAD_MS
  );
  const dropped = batch.events.length - events.length;
  if (events.length === 0) {
    return { accepted: 0, dropped };
  }

  const times = events.map(({ occurredAt }) => occurredAt);
  const { device } = batch;
  const install = db
    .insert(analyticsInstall)
    .values({
      installId: batch.installId,
      userId,
      platform: device.platform,
      osVersion: device.osVersion,
      appVersion: device.appVersion,
      deviceType: device.deviceType,
      birthYear: device.birthYear,
      firstSeenAt: Math.min(...times),
      lastSeenAt: Math.max(...times),
    })
    .onConflictDoUpdate({
      target: analyticsInstall.installId,
      set: {
        // A signed-out device stays linked to the Believer last signed in.
        userId: sql`coalesce(excluded.user_id, ${analyticsInstall.userId})`,
        platform: sql`excluded.platform`,
        osVersion: sql`excluded.os_version`,
        appVersion: sql`excluded.app_version`,
        deviceType: sql`excluded.device_type`,
        birthYear: sql`excluded.birth_year`,
        firstSeenAt: sql`min(${analyticsInstall.firstSeenAt}, excluded.first_seen_at)`,
        lastSeenAt: sql`max(${analyticsInstall.lastSeenAt}, excluded.last_seen_at)`,
      },
    });
  const inserted = db
    .insert(analyticsEvent)
    .values(
      events.map((event) => ({
        id: event.id,
        installId: batch.installId,
        userId,
        type: event.type,
        name: event.name,
        data: event.data ?? null,
        occurredAt: event.occurredAt,
        receivedAt: now,
      }))
    )
    .onConflictDoNothing();

  await db.batch([install, inserted]);
  return { accepted: events.length, dropped };
};
