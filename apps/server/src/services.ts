import { createAuth } from "@alrisali/auth";
import { createDb } from "@alrisali/db-server";

import { createUserDatabaseHost } from "@/features/account";
import { createExpoPushTransport } from "@/features/announcements";
import { createRecitationSource } from "@/features/quran";
import { createContentDatabase } from "@/shared/lib/content-database";
import { createFileBucket } from "@/shared/lib/file-bucket";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
export const userDatabases = createUserDatabaseHost(ENV);
export const content = createContentDatabase({
  host: userDatabases,
  name: ENV.CONTENT_DATABASE_NAME,
});
export const recitation = createRecitationSource(ENV);
export const files = createFileBucket(ENV);
export const push = createExpoPushTransport({
  accessToken: ENV.EXPO_ACCESS_TOKEN,
});
