import { createHash } from "node:crypto";

/**
 * Where Believers' cloud databases live: Turso Cloud through its Platform
 * API, or a local `tursodb --sync-server` for development and tests.
 */
export interface UserDatabaseHost {
  /**
   * Creates the database unless it already exists, and returns the URL
   * devices sync it at. Calling it again for the same name is harmless.
   */
  ensure: (name: string) => Promise<{ url: string }>;
  /** A short-lived token that opens this one database and no other. */
  mintToken: (name: string) => Promise<{ token: string; expiresAt: number }>;
}

/** How long a minted database token lives. */
export const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

/**
 * The cloud database name for a Believer, derived from their user id. Turso
 * names allow only lowercase letters, digits and dashes, and the name is
 * part of a DNS label, so the id is hashed rather than used as is.
 */
export const userDatabaseName = (userId: string): string =>
  `b-${createHash("sha256").update(userId).digest("hex").slice(0, 24)}`;
