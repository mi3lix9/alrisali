import { believerDatabase } from "@alrisali/db-server/schema/believer-database";

import type { Context } from "@/context";
import { authed } from "@/shared/lib/orpc";

import { userDatabaseName } from "./user-database-host";

/**
 * The Believer's cloud database, created on their first call. Idempotent:
 * a concurrent first call creates nothing twice (the host's create is
 * idempotent and the row is written once).
 */
const ensureBelieverDatabase = async (
  { db, userDatabases }: Pick<Context, "db" | "userDatabases">,
  userId: string
): Promise<{ name: string; url: string }> => {
  const existing = await db.query.believerDatabase.findFirst({
    columns: { name: true, url: true },
    where: { userId },
  });
  if (existing) {
    return existing;
  }
  const name = userDatabaseName(userId);
  const { url } = await userDatabases.ensure(name);
  await db
    .insert(believerDatabase)
    .values({ userId, name, url })
    .onConflictDoNothing();
  return { name, url };
};

export const ensureUserDatabase = authed.account.ensureUserDatabase.handler(
  async ({ context }) => {
    const { url } = await ensureBelieverDatabase(
      context,
      context.session.user.id
    );
    return { url };
  }
);

/** Mints only for the caller's own database: no input names a database. */
export const userDatabaseToken = authed.account.userDatabaseToken.handler(
  async ({ context }) => {
    const { name } = await ensureBelieverDatabase(
      context,
      context.session.user.id
    );
    return context.userDatabases.mintToken(name);
  }
);
