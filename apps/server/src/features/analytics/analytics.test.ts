import { createDb } from "@alrisali/db-server";
import type { Database } from "@alrisali/db-server";
import { migrateDb } from "@alrisali/db-server/migrate";
import { analyticsEvent } from "@alrisali/db-server/schema/analytics";
import { user } from "@alrisali/db-server/schema/auth";
import type {
  AnalyticsBatch,
  AnalyticsEvent,
} from "@alrisali/domain/analytics";
import { beforeEach, describe, expect, it } from "vitest";

import { DAY_MS, recordBatch } from "./ingest";
import {
  ages,
  dailyActiveUsers,
  devices,
  featureUsage,
  guestShare,
  popularSections,
  retention,
  summary,
} from "./reports";

// 2026-10-15T12:00:00Z
const NOW = Date.UTC(2026, 9, 15, 12);
const HOUR_MS = 60 * 60 * 1000;

const PHONE: AnalyticsBatch["device"] = {
  platform: "ios",
  osVersion: "26.1",
  appVersion: "2.0.0",
  deviceType: "phone",
  birthYear: null,
};

let db: Database;
let ids = 0;

const installId = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const newEvent = (
  type: AnalyticsEvent["type"],
  name: string,
  occurredAt: number
): AnalyticsEvent => {
  ids += 1;
  return {
    id: `11111111-1111-4111-8111-${String(ids).padStart(12, "0")}`,
    type,
    name,
    occurredAt,
  };
};

interface Send {
  install: number;
  events: AnalyticsEvent[];
  userId?: string | null;
  device?: Partial<AnalyticsBatch["device"]>;
  now?: number;
}

const send = ({ install, events, userId = null, device, now = NOW }: Send) =>
  recordBatch(db, {
    batch: {
      installId: installId(install),
      device: { ...PHONE, ...device },
      events,
    },
    userId,
    now,
  });

const addBeliever = async (id: string) => {
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` });
  return id;
};

const ago = (days: number) => NOW - days * DAY_MS;

describe("usage analytics", () => {
  beforeEach(async () => {
    db = createDb({ DATABASE_URL: ":memory:", DATABASE_AUTH_TOKEN: "" });
    await migrateDb(db);
  });

  describe(recordBatch, () => {
    it("stores a resent batch once", async () => {
      const events = [
        newEvent("screen_view", "quran", NOW),
        newEvent("feature_use", "tasbih", NOW),
      ];

      await expect(send({ install: 1, events })).resolves.toStrictEqual({
        accepted: 2,
        dropped: 0,
      });
      await send({ install: 1, events });

      await expect(db.$count(analyticsEvent)).resolves.toBe(2);
    });

    it("drops events older than 30 days or from the future", async () => {
      const result = await send({
        install: 1,
        events: [
          newEvent("screen_view", "quran", ago(31)),
          newEvent("screen_view", "quran", NOW + DAY_MS),
          newEvent("screen_view", "home", ago(29)),
        ],
      });

      expect(result).toStrictEqual({ accepted: 1, dropped: 2 });
      await expect(db.$count(analyticsEvent)).resolves.toBe(1);
    });

    it("keeps an installation linked to the Believer after they sign out", async () => {
      const zainab = await addBeliever("zainab");
      await send({
        install: 1,
        userId: zainab,
        events: [newEvent("screen_view", "home", ago(1))],
      });
      await send({
        install: 1,
        events: [newEvent("screen_view", "home", NOW)],
      });

      const share = await guestShare(db, { days: 7 }, NOW);
      expect(share.installs).toStrictEqual({
        guest: 0,
        believer: 1,
        guestPercentage: 0,
      });
      expect(share.events).toStrictEqual({
        guest: 1,
        believer: 1,
        guestPercentage: 50,
      });
    });
  });

  describe(summary, () => {
    it("counts installations, Believers, events and active installations", async () => {
      await addBeliever("zainab");
      await send({
        install: 1,
        events: [
          newEvent("screen_view", "home", NOW - HOUR_MS),
          newEvent("screen_view", "quran", NOW),
        ],
      });
      await send({
        install: 2,
        events: [newEvent("screen_view", "home", ago(3))],
      });
      await send({
        install: 3,
        events: [newEvent("screen_view", "home", ago(20))],
      });

      await expect(summary(db, NOW)).resolves.toStrictEqual({
        installs: 3,
        believers: 1,
        activeToday: 1,
        activeWeek: 2,
        activeMonth: 3,
        events: 4,
        eventsToday: 2,
      });
    });
  });

  describe(popularSections, () => {
    it("ranks screens viewed in the window with their share", async () => {
      await send({
        install: 1,
        events: [
          newEvent("screen_view", "quran", ago(1)),
          newEvent("screen_view", "quran", ago(2)),
          newEvent("screen_view", "quran", ago(2)),
          newEvent("screen_view", "home", ago(1)),
          newEvent("screen_view", "home", ago(10)),
          newEvent("feature_use", "tasbih", ago(1)),
        ],
      });
      await send({
        install: 2,
        events: [newEvent("screen_view", "quran", ago(1))],
      });

      await expect(
        popularSections(db, { days: 7 }, NOW)
      ).resolves.toStrictEqual([
        { name: "quran", count: 4, installs: 2, percentage: 80 },
        { name: "home", count: 1, installs: 1, percentage: 20 },
      ]);
    });
  });

  describe(featureUsage, () => {
    it("ranks features used in the window", async () => {
      await send({
        install: 1,
        events: [
          newEvent("feature_use", "prayer-log", ago(1)),
          newEvent("feature_use", "tasbih", ago(1)),
          newEvent("feature_use", "tasbih", ago(1)),
          newEvent("action", "sign-in", ago(1)),
        ],
      });

      await expect(featureUsage(db, { days: 7 }, NOW)).resolves.toStrictEqual([
        { name: "tasbih", count: 2, installs: 1, percentage: 67 },
        { name: "prayer-log", count: 1, installs: 1, percentage: 33 },
      ]);
    });
  });

  describe(dailyActiveUsers, () => {
    it("counts distinct installations and Believers per UTC day, oldest first", async () => {
      const zainab = await addBeliever("zainab");
      await send({
        install: 1,
        userId: zainab,
        events: [
          newEvent("screen_view", "home", NOW),
          newEvent("feature_use", "tasbih", NOW),
          newEvent("screen_view", "home", ago(2)),
        ],
      });
      await send({
        install: 2,
        events: [newEvent("action", "open", NOW - HOUR_MS)],
      });

      await expect(
        dailyActiveUsers(db, { days: 3, offset: 0 }, NOW)
      ).resolves.toStrictEqual([
        { date: "2026-10-13", installs: 1, believers: 1 },
        { date: "2026-10-14", installs: 0, believers: 0 },
        { date: "2026-10-15", installs: 2, believers: 1 },
      ]);
    });

    it("shifts back by whole windows", async () => {
      await send({
        install: 1,
        events: [newEvent("screen_view", "home", ago(3))],
      });

      await expect(
        dailyActiveUsers(db, { days: 2, offset: 1 }, NOW)
      ).resolves.toStrictEqual([
        { date: "2026-10-12", installs: 1, believers: 0 },
        { date: "2026-10-13", installs: 0, believers: 0 },
      ]);
    });
  });

  describe(retention, () => {
    it("counts installations active again 1, 7 and 30 days after their first event", async () => {
      // First seen 10 days ago, back on day 8: retained on days 1 and 7.
      await send({
        install: 1,
        now: ago(10),
        events: [newEvent("screen_view", "home", ago(10))],
      });
      await send({
        install: 1,
        events: [newEvent("screen_view", "home", ago(2))],
      });
      // First seen 5 days ago, never back: eligible for day 1 only.
      await send({
        install: 2,
        events: [newEvent("screen_view", "home", ago(5))],
      });
      // First seen today: in the cohort, eligible for nothing yet.
      await send({
        install: 3,
        events: [newEvent("screen_view", "home", NOW)],
      });

      await expect(
        retention(db, { cohortDays: 30 }, NOW)
      ).resolves.toStrictEqual({
        cohort: 3,
        days: [
          { day: 1, eligible: 2, retained: 1, percentage: 50 },
          { day: 7, eligible: 1, retained: 1, percentage: 100 },
          { day: 30, eligible: 0, retained: 0, percentage: 0 },
        ],
      });
    });
  });

  describe(guestShare, () => {
    it("splits events and active installations between Guests and Believers", async () => {
      const zainab = await addBeliever("zainab");
      await send({
        install: 1,
        userId: zainab,
        events: [newEvent("screen_view", "home", ago(1))],
      });
      await send({
        install: 2,
        events: [
          newEvent("screen_view", "home", ago(1)),
          newEvent("screen_view", "quran", ago(1)),
        ],
      });
      await send({
        install: 3,
        events: [newEvent("screen_view", "home", ago(1))],
      });

      await expect(guestShare(db, { days: 7 }, NOW)).resolves.toStrictEqual({
        events: { guest: 3, believer: 1, guestPercentage: 75 },
        installs: { guest: 2, believer: 1, guestPercentage: 67 },
      });
    });
  });

  describe(devices, () => {
    it("breaks active installations down by their latest metadata", async () => {
      await send({
        install: 1,
        device: { appVersion: "1.9.0" },
        events: [newEvent("screen_view", "home", ago(2))],
      });
      await send({
        install: 1,
        events: [newEvent("screen_view", "home", NOW)],
      });
      await send({
        install: 2,
        device: { platform: "android", osVersion: "16", deviceType: "tablet" },
        events: [newEvent("screen_view", "home", NOW)],
      });
      await send({
        install: 3,
        device: { platform: "android", osVersion: "16" },
        events: [newEvent("screen_view", "home", ago(20))],
      });

      await expect(devices(db, { days: 7 }, NOW)).resolves.toStrictEqual({
        installs: 2,
        platforms: [
          { name: "android", count: 1, percentage: 50 },
          { name: "ios", count: 1, percentage: 50 },
        ],
        deviceTypes: [
          { name: "phone", count: 1, percentage: 50 },
          { name: "tablet", count: 1, percentage: 50 },
        ],
        osVersions: [
          { name: "android 16", count: 1, percentage: 50 },
          { name: "ios 26.1", count: 1, percentage: 50 },
        ],
        appVersions: [{ name: "2.0.0", count: 2, percentage: 100 }],
      });
    });
  });

  describe(ages, () => {
    it("counts each Believer once across devices and each Guest installation once", async () => {
      const zainab = await addBeliever("zainab");
      // Zainab on two devices: born 1990 (36 in 2026).
      await send({
        install: 1,
        userId: zainab,
        device: { birthYear: 1990 },
        events: [newEvent("screen_view", "home", ago(1))],
      });
      await send({
        install: 2,
        userId: zainab,
        events: [newEvent("screen_view", "home", NOW)],
      });
      // A Guest born 2010 (16), and one who gave no birth year.
      await send({
        install: 3,
        device: { birthYear: 2010 },
        events: [newEvent("screen_view", "home", NOW)],
      });
      await send({
        install: 4,
        events: [newEvent("screen_view", "home", NOW)],
      });

      await expect(ages(db, { days: 30 }, NOW)).resolves.toStrictEqual({
        bands: [
          { band: "under-18", count: 1, percentage: 50 },
          { band: "18-25", count: 0, percentage: 0 },
          { band: "26-35", count: 0, percentage: 0 },
          { band: "36-50", count: 1, percentage: 50 },
          { band: "over-50", count: 0, percentage: 0 },
        ],
        withBirthYear: 2,
        withoutBirthYear: 1,
      });
    });
  });
});
