import { createDailyContentRepository } from "@alrisali/db-content/daily-content";
import type { DailyContentRepository } from "@alrisali/db-content/daily-content";
import { WEEKDAYS } from "@alrisali/domain/daily-content";

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

export const dailyContentRouter = { list, set };
