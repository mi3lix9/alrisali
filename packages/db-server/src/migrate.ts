import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/libsql/migrator";

import type { Database } from "./index";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("migrations", import.meta.url));

/** Applies every pending migration in `src/migrations` to the database. */
export const migrateDb = async (database: Database): Promise<void> => {
  await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });
};
