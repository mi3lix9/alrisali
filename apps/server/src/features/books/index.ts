import { createAmalRepository } from "@alrisali/db-content/books";
import type { AmalRepository } from "@alrisali/db-content/books";

import { admin } from "@/shared/lib/orpc";

const amalOf = async (repository: AmalRepository) => ({
  entries: (await repository.all()) ?? [],
});

const amalList = admin.books.amalList.handler(async ({ context }) =>
  amalOf(createAmalRepository(await context.content.db()))
);

/** Devices show the new index after their next pull. */
const amalSet = admin.books.amalSet.handler(
  async ({ context, input: { month, day, acts } }) => {
    const repository = createAmalRepository(await context.content.db());
    await repository.replaceDay(month, day, acts);
    return amalOf(repository);
  }
);

export const booksRouter = { amalList, amalSet };
