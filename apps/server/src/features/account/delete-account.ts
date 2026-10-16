import {
  analyticsEvent,
  analyticsInstall,
} from "@alrisali/db-server/schema/analytics";
import { account, session, user } from "@alrisali/db-server/schema/auth";
import { believerDatabase } from "@alrisali/db-server/schema/believer-database";
import { contactMessage } from "@alrisali/db-server/schema/contact";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";

import { authed } from "@/shared/lib/orpc";

import { userDatabaseName } from "./user-database";

/**
 * Account deletion (Apple guideline 5.1.1(v)). Sign in with Apple is revoked
 * first, as Apple requires: if Apple refuses, nothing is deleted and the
 * Believer tries again. Then the cloud database: if destroying it fails, the
 * account stays and the Believer can try again, rather than leave a
 * database nobody can reach. The database name comes from the user id, so a
 * database created without its row being written is destroyed too.
 */
export const deleteAccount = authed.account.deleteAccount.handler(
  async ({
    context: { db, userDatabases, apple, session: current },
    input,
  }) => {
    const userId = current.user.id;
    const appleGrant = await db.query.account.findFirst({
      columns: { idToken: true, accessToken: true, refreshToken: true },
      where: { userId, providerId: "apple" },
    });
    if (appleGrant) {
      try {
        await apple.revoke(appleGrant, input?.appleAuthorizationCode);
      } catch (error) {
        throw new ORPCError("SERVICE_UNAVAILABLE", {
          message: "Could not revoke Sign in with Apple; try again",
          cause: error,
        });
      }
    }
    const record = await db.query.believerDatabase.findFirst({
      columns: { name: true },
      where: { userId },
    });
    await userDatabases.destroy(record?.name ?? userDatabaseName(userId));
    // One batch, one transaction: every row goes or none does. The foreign
    // keys cascade from `user` as well; deleting each table explicitly does
    // not depend on them being enforced. Usage analytics keep their counts
    // but lose the link to the Believer.
    await db.batch([
      db.delete(contactMessage).where(eq(contactMessage.userId, userId)),
      db
        .update(analyticsEvent)
        .set({ userId: null })
        .where(eq(analyticsEvent.userId, userId)),
      db
        .update(analyticsInstall)
        .set({ userId: null })
        .where(eq(analyticsInstall.userId, userId)),
      db.delete(believerDatabase).where(eq(believerDatabase.userId, userId)),
      db.delete(session).where(eq(session.userId, userId)),
      db.delete(account).where(eq(account.userId, userId)),
      db.delete(user).where(eq(user.id, userId)),
    ]);
    return { deleted: true as const };
  }
);
