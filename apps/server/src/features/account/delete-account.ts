import { account, session, user } from "@alrisali/db-server/schema/auth";
import { believerDatabase } from "@alrisali/db-server/schema/believer-database";
import { contactMessage } from "@alrisali/db-server/schema/contact";
import { eq } from "drizzle-orm";

import { authed } from "@/shared/lib/orpc";

import { userDatabaseName } from "./user-database";

/**
 * Account deletion (Apple guideline 5.1.1(v)). The cloud database goes
 * first: if destroying it fails, the account stays and the Believer can try
 * again, rather than leave a database nobody can reach. The database name
 * comes from the user id, so a database created without its row being
 * written is destroyed too.
 */
export const deleteAccount = authed.account.deleteAccount.handler(
  async ({ context: { db, userDatabases, session: current } }) => {
    const userId = current.user.id;
    const record = await db.query.believerDatabase.findFirst({
      columns: { name: true },
      where: { userId },
    });
    await userDatabases.destroy(record?.name ?? userDatabaseName(userId));
    // One batch, one transaction: every row goes or none does. The foreign
    // keys cascade from `user` as well; deleting each table explicitly does
    // not depend on them being enforced.
    await db.batch([
      db.delete(contactMessage).where(eq(contactMessage.userId, userId)),
      db.delete(believerDatabase).where(eq(believerDatabase.userId, userId)),
      db.delete(session).where(eq(session.userId, userId)),
      db.delete(account).where(eq(account.userId, userId)),
      db.delete(user).where(eq(user.id, userId)),
    ]);
    return { deleted: true as const };
  }
);
