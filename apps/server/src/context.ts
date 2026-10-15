import type { Auth, Session } from "@alrisali/auth";
import type { Database } from "@alrisali/db-server";

import type { ContentDatabase } from "./shared/lib/content-database";
import type { FileBucket } from "./shared/lib/file-bucket";
import type { RecitationSource } from "./shared/lib/recitation-source";
import type { UserDatabaseHost } from "./shared/lib/user-database-host";

/** What every oRPC procedure receives. */
export interface Context {
  session: Session | null;
  db: Database;
  /** Where Believers' cloud databases are created and tokens minted. */
  userDatabases: UserDatabaseHost;
  /** The shared content database Admins publish to. */
  content: ContentDatabase;
  /** Recitation from the Quran Foundation audio API. */
  recitation: RecitationSource;
  /** The bucket Admins upload files to. */
  files: FileBucket;
}

export interface CreateContextOptions {
  auth: Auth;
  db: Database;
  userDatabases: UserDatabaseHost;
  content: ContentDatabase;
  recitation: RecitationSource;
  files: FileBucket;
  headers: Headers;
}

/** Resolves the caller's session from the request's cookies, if any. */
export const createContext = async ({
  auth,
  db,
  userDatabases,
  content,
  recitation,
  files,
  headers,
}: CreateContextOptions): Promise<Context> => ({
  db,
  userDatabases,
  content,
  recitation,
  files,
  session: await auth.api.getSession({ headers }),
});
