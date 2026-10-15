import { createAuth } from "@alrisali/auth";
import { createDb } from "@alrisali/db-server";

import { createUserDatabaseHost } from "@/features/account";
import { createContentDatabase } from "@/shared/lib/content-database";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
export const userDatabases = createUserDatabaseHost(ENV);
export const content = createContentDatabase({
  host: userDatabases,
  name: ENV.CONTENT_DATABASE_NAME,
});
