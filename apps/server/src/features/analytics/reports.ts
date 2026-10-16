import type { Database } from "@alrisali/db-server";
import {
  analyticsEvent as event,
  analyticsInstall as install,
} from "@alrisali/db-server/schema/analytics";
import { user } from "@alrisali/db-server/schema/auth";
import { AGE_BANDS, ageBandOf } from "@alrisali/domain/analytics";
import type { AgeBand, AnalyticsEventType } from "@alrisali/domain/analytics";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  gte,
  lt,
  lte,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { DAY_MS } from "./ingest";

// The Admins' usage reports, computed from the events the devices sent.
// Every report takes `now` (epoch ms) so tests can pin the clock. Days are
// UTC days.

const RETENTION_DAYS = [1, 7, 30] as const;
const POPULAR_SECTIONS_LIMIT = 10;
const FEATURE_USAGE_LIMIT = 20;
const VERSIONS_LIMIT = 10;

const percentOf = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0;

const startOfUtcDay = (time: number): number => time - (time % DAY_MS);

/** The UTC day an event fell on, as a whole number of days since 1970. */
const eventDay = sql<number>`${event.occurredAt} / ${sql.raw(String(DAY_MS))}`;

const firstRow = <Row>(rows: Row[]): Row => {
  const [row] = rows;
  if (!row) {
    throw new Error("An aggregate query returned no row");
  }
  return row;
};

export const summary = async (db: Database, now: number) => {
  const activeSince = async (since: number) =>
    firstRow(
      await db
        .select({ value: countDistinct(event.installId) })
        .from(event)
        .where(gte(event.occurredAt, since))
    ).value;
  const today = startOfUtcDay(now);

  const [installs, believers, events, eventsToday] = await Promise.all([
    db.$count(install),
    db.$count(user),
    db.$count(event),
    db.$count(event, gte(event.occurredAt, today)),
  ]);
  const [activeToday, activeWeek, activeMonth] = await Promise.all([
    activeSince(today),
    activeSince(now - 7 * DAY_MS),
    activeSince(now - 30 * DAY_MS),
  ]);
  return {
    installs,
    believers,
    activeToday,
    activeWeek,
    activeMonth,
    events,
    eventsToday,
  };
};

const usageOf = async (
  db: Database,
  type: AnalyticsEventType,
  { days, limit, now }: { days: number; limit: number; now: number }
) => {
  const inWindow = and(
    eq(event.type, type),
    gte(event.occurredAt, now - days * DAY_MS)
  );
  const [rows, total] = await Promise.all([
    db
      .select({
        name: event.name,
        count: count(),
        installs: countDistinct(event.installId),
      })
      .from(event)
      .where(inWindow)
      .groupBy(event.name)
      .orderBy(desc(count()), asc(event.name))
      .limit(limit),
    db.$count(event, inWindow),
  ]);
  return rows.map((row) => ({
    ...row,
    percentage: percentOf(row.count, total),
  }));
};

export const popularSections = (
  db: Database,
  { days }: { days: number },
  now: number
) => usageOf(db, "screen_view", { days, limit: POPULAR_SECTIONS_LIMIT, now });

export const featureUsage = (
  db: Database,
  { days }: { days: number },
  now: number
) => usageOf(db, "feature_use", { days, limit: FEATURE_USAGE_LIMIT, now });

/** One entry per day, oldest first, days without events included. */
export const dailyActiveUsers = async (
  db: Database,
  { days, offset }: { days: number; offset: number },
  now: number
) => {
  const lastDay = startOfUtcDay(now) / DAY_MS - offset * days;
  const firstDay = lastDay - days + 1;
  const rows = await db
    .select({
      day: eventDay,
      installs: countDistinct(event.installId),
      believers: countDistinct(event.userId),
    })
    .from(event)
    .where(
      and(
        gte(event.occurredAt, firstDay * DAY_MS),
        lt(event.occurredAt, (lastDay + 1) * DAY_MS)
      )
    )
    .groupBy(eventDay);
  const byDay = new Map(rows.map((row) => [Number(row.day), row]));

  return Array.from({ length: days }, (_, index) => {
    const day = firstDay + index;
    return {
      date: new Date(day * DAY_MS).toISOString().slice(0, 10),
      installs: byDay.get(day)?.installs ?? 0,
      believers: byDay.get(day)?.believers ?? 0,
    };
  });
};

export const retention = async (
  db: Database,
  { cohortDays }: { cohortDays: number },
  now: number
) => {
  const inCohort = gte(install.firstSeenAt, now - cohortDays * DAY_MS);
  const cohort = await db.$count(install, inCohort);

  const days = await Promise.all(
    RETENTION_DAYS.map(async (day) => {
      const eligible = and(
        inCohort,
        lte(install.firstSeenAt, now - day * DAY_MS)
      );
      const returned = exists(
        db
          .select({ one: sql`1` })
          .from(event)
          .where(
            and(
              eq(event.installId, install.installId),
              gte(
                event.occurredAt,
                sql`${install.firstSeenAt} + ${day * DAY_MS}`
              )
            )
          )
      );
      const [eligibleCount, retained] = await Promise.all([
        db.$count(install, eligible),
        db.$count(install, and(eligible, returned)),
      ]);
      return {
        day,
        eligible: eligibleCount,
        retained,
        percentage: percentOf(retained, eligibleCount),
      };
    })
  );
  return { cohort, days };
};

export const guestShare = async (
  db: Database,
  { days }: { days: number },
  now: number
) => {
  const inWindow = gte(event.occurredAt, now - days * DAY_MS);
  const perInstall = db
    .select({
      signedIn: sql<number>`max(${event.userId} is not null)`.as("signed_in"),
    })
    .from(event)
    .where(inWindow)
    .groupBy(event.installId)
    .as("per_install");

  const [events, believerEvents, installs] = await Promise.all([
    db.$count(event, inWindow),
    db.$count(event, and(inWindow, sql`${event.userId} is not null`)),
    db
      .select({
        total: count(),
        believer: sql<number>`coalesce(sum(${perInstall.signedIn}), 0)`,
      })
      .from(perInstall),
  ]);
  const { total, believer } = firstRow(installs);
  const guestEvents = events - believerEvents;
  const guestInstalls = total - Number(believer);
  return {
    events: {
      guest: guestEvents,
      believer: believerEvents,
      guestPercentage: percentOf(guestEvents, events),
    },
    installs: {
      guest: guestInstalls,
      believer: Number(believer),
      guestPercentage: percentOf(guestInstalls, total),
    },
  };
};

export const devices = async (
  db: Database,
  { days }: { days: number },
  now: number
) => {
  const active = gte(install.lastSeenAt, now - days * DAY_MS);
  const installs = await db.$count(install, active);
  const shareBy = async (column: SQL<string>, limit?: number) => {
    const query = db
      .select({ name: column, count: count() })
      .from(install)
      .where(active)
      .groupBy(column)
      .orderBy(desc(count()), asc(column));
    const rows = await (limit === undefined ? query : query.limit(limit));
    return rows.map((row) => ({
      ...row,
      percentage: percentOf(row.count, installs),
    }));
  };

  const [platforms, deviceTypes, osVersions, appVersions] = await Promise.all([
    shareBy(sql<string>`${install.platform}`),
    shareBy(sql<string>`${install.deviceType}`),
    shareBy(
      sql<string>`${install.platform} || ' ' || ${install.osVersion}`,
      VERSIONS_LIMIT
    ),
    shareBy(sql<string>`${install.appVersion}`, VERSIONS_LIMIT),
  ]);
  return { installs, platforms, deviceTypes, osVersions, appVersions };
};

/**
 * A person is a signed-in Believer (across their devices) or, for a Guest,
 * one installation. Their birth year is the one on their most recently seen
 * installation that has one.
 */
export const ages = async (
  db: Database,
  { days }: { days: number },
  now: number
) => {
  const rows = await db
    .select({
      installId: install.installId,
      userId: install.userId,
      birthYear: install.birthYear,
    })
    .from(install)
    .where(gte(install.lastSeenAt, now - days * DAY_MS))
    .orderBy(asc(install.lastSeenAt));

  const birthYears = new Map<string, number | null>();
  for (const row of rows) {
    const person = row.userId ?? row.installId;
    birthYears.set(person, row.birthYear ?? birthYears.get(person) ?? null);
  }

  const currentYear = new Date(now).getUTCFullYear();
  const counts = new Map<AgeBand, number>();
  let withBirthYear = 0;
  for (const birthYear of birthYears.values()) {
    if (birthYear !== null) {
      withBirthYear += 1;
      const band = ageBandOf(birthYear, currentYear);
      counts.set(band, (counts.get(band) ?? 0) + 1);
    }
  }
  return {
    bands: AGE_BANDS.map((band) => ({
      band,
      count: counts.get(band) ?? 0,
      percentage: percentOf(counts.get(band) ?? 0, withBirthYear),
    })),
    withBirthYear,
    withoutBirthYear: birthYears.size - withBirthYear,
  };
};
