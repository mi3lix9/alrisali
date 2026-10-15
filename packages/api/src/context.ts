import type { Session } from "@alrisali/auth";
import type { Database } from "@alrisali/db-server";

export interface Context {
  session: Session | null;
  db: Database;
}
