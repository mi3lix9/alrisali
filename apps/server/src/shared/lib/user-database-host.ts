/**
 * Where Believers' cloud databases (and the shared content database) live:
 * Turso Cloud through its Platform API, or a local `tursodb --sync-server`
 * for development and tests.
 */
export interface UserDatabaseHost {
  /**
   * Creates the database unless it already exists, and returns the URL
   * devices sync it at. Calling it again for the same name is harmless.
   */
  ensure: (name: string) => Promise<{ url: string }>;
  /**
   * A short-lived token that opens this one database and no other; a
   * read-only one lets its holder pull but never push or write.
   */
  mintToken: (
    name: string,
    access?: DatabaseAccess
  ) => Promise<{ token: string; expiresAt: number }>;
}

/** What a minted token allows; Believers' own databases get full access. */
export type DatabaseAccess = "full-access" | "read-only";

/** How long a minted database token lives. */
export const TOKEN_LIFETIME_MS = 60 * 60 * 1000;
