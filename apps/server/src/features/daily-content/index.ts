import {
  createDailyContentRepository,
  createWorshipMappingRepository,
} from "@alrisali/db-content/daily-content";
import type {
  DailyContentRepository,
  WorshipMappingRepository,
} from "@alrisali/db-content/daily-content";
import {
  EVERY_DAY,
  WEEKDAYS,
  WORSHIP_KINDS,
} from "@alrisali/domain/daily-content";
import type { WorshipEntry } from "@alrisali/domain/daily-content";

import { admin } from "@/shared/lib/orpc";

/** Every weekday in week order, with its Supplication id or null. */
const mapOf = async (repository: DailyContentRepository) => {
  const entries = await repository.all();
  const chosen = new Map(
    entries.map((entry) => [entry.weekday, entry.supplicationId])
  );
  return {
    days: WEEKDAYS.map((weekday) => ({
      weekday,
      supplicationId: chosen.get(weekday) ?? null,
    })),
  };
};

const list = admin.dailyContent.list.handler(async ({ context }) =>
  mapOf(createDailyContentRepository(await context.content.db()))
);

/** Devices feature the new choice after their next pull. */
const set = admin.dailyContent.set.handler(
  async ({ context, input: { weekday, supplicationId } }) => {
    const repository = createDailyContentRepository(await context.content.db());
    await (supplicationId === null
      ? repository.clear(weekday)
      : repository.set({ weekday, supplicationId }));
    return mapOf(repository);
  }
);

const DAYS: readonly string[] = [...WEEKDAYS, EVERY_DAY];

/** Orders entries by kind, then day (week order). */
const rank = (row: { kind: string; day: string }) =>
  WORSHIP_KINDS.indexOf(row.kind as WorshipEntry["kind"]) * DAYS.length +
  DAYS.indexOf(row.day);

/** Entries ordered by kind, then day (week order), then id. */
const worshipOf = async (repository: WorshipMappingRepository) => {
  const rows = await repository.all();
  return {
    entries: rows
      .toSorted(
        (a, b) =>
          rank(a) - rank(b) || a.supplicationId.localeCompare(b.supplicationId)
      )
      .map((row) => row as WorshipEntry),
  };
};

const worshipList = admin.dailyContent.worshipList.handler(
  async ({ context }) =>
    worshipOf(createWorshipMappingRepository(await context.content.db()))
);

/** Devices show the new mapping after their next pull. */
const worshipSet = admin.dailyContent.worshipSet.handler(
  async ({ context, input: { kind, day, supplicationIds } }) => {
    const repository = createWorshipMappingRepository(
      await context.content.db()
    );
    await repository.replace(kind, day, supplicationIds);
    return worshipOf(repository);
  }
);

export const dailyContentRouter = { list, set, worshipList, worshipSet };
