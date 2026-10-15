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
