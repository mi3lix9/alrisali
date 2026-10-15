import type { Auth, Session, SignInOptions } from "@alrisali/auth";
import type { Database } from "@alrisali/db-server";

import type { AppleRevoker } from "./shared/lib/apple-revoker";
import type { ContentDatabase } from "./shared/lib/content-database";
import type { FileBucket } from "./shared/lib/file-bucket";
import type { PushTransport } from "./shared/lib/push-transport";
import type { UserDatabaseHost } from "./shared/lib/user-database-host";

/** Who sent the request, as far as the server can tell. */
export interface RequestClient {
  /** The client's IP address; null when the runtime could not tell. */
  ip: string | null;
  userAgent: string | null;
}

/** What every oRPC procedure receives. */
export interface Context {
  session: Session | null;
  db: Database;
  /** Where Believers' cloud databases are created and tokens minted. */
  userDatabases: UserDatabaseHost;
  /** The shared content database Admins publish to. */
  content: ContentDatabase;
  /** The bucket Admins upload files to. */
  files: FileBucket;
  client: RequestClient;
  /** Secret key IP addresses are hashed with before they are stored. */
  ipHashKey: string;
  /** Where Announcements are sent: Expo Push. */
  push: PushTransport;
  /** Revokes Sign in with Apple when a Believer deletes their account. */
  apple: AppleRevoker;
  /** How clients may sign in (`account.signInOptions`). */
  signInOptions: SignInOptions;
}

export interface CreateContextOptions {
  auth: Auth;
  db: Database;
  userDatabases: UserDatabaseHost;
  content: ContentDatabase;
  files: FileBucket;
  push: PushTransport;
  apple: AppleRevoker;
  signInOptions: SignInOptions;
  headers: Headers;
  clientIp: string | null;
  ipHashKey: string;
}

/** Resolves the caller's session from the request's cookies, if any. */
export const createContext = async ({
  auth,
  db,
  userDatabases,
  content,
  files,
  push,
  apple,
  signInOptions,
  headers,
  clientIp,
  ipHashKey,
}: CreateContextOptions): Promise<Context> => ({
  db,
  userDatabases,
  content,
  files,
  client: { ip: clientIp, userAgent: headers.get("user-agent") },
  ipHashKey,
  push,
  apple,
  signInOptions,
  session: await auth.api.getSession({ headers }),
});
