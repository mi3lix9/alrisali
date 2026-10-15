import type { Session } from "@alrisali/auth";
import type { Database } from "@alrisali/db-server";

export type Context = {
  session: Session | null;
  db: Database;
};
