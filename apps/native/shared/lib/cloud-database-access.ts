/**
 * Where the signed-in Believer's cloud database is and how to open it
 * (ADR-0001). The server creates the database and mints short-lived tokens
 * scoped to it; this keeps both in memory, so a Guest (or a signed-out
 * Believer) has no URL and their sync stays paused.
 */

/** Fetch a new token this long before the current one expires. */
const TOKEN_REFRESH_MARGIN_MS = 60_000;

/** The requests behind the access; the device uses the auth and oRPC clients. */
export interface CloudDatabaseServer {
  /** The session cookie, empty for a Guest. */
  getCookie: () => Promise<string>;
  ensureUserDatabase: () => Promise<{ url: string }>;
  userDatabaseToken: () => Promise<{ token: string; expiresAt: number }>;
}

export const createCloudDatabaseAccess = (server: CloudDatabaseServer) => {
  let url: string | null = null;
  let token: { token: string; expiresAt: number } | null = null;
  let fetchingToken: Promise<string> | undefined;
  // Bumped whenever the Believer on the device changes. A request answered
  // after a bump belongs to the last Believer, so its answer is dropped
  // instead of restoring their access.
  let session = 0;

  const fetchToken = async (): Promise<string> => {
    const requestedIn = session;
    try {
      const fetched = await server.userDatabaseToken();
      if (requestedIn !== session) {
        throw new Error("The Believer changed while their token was fetched.");
      }
      token = fetched;
      return fetched.token;
    } finally {
      if (requestedIn === session) {
        fetchingToken = undefined;
      }
    }
  };

  return {
    /** The sync URL, or null while the Believer is a Guest. */
    url: (): string | null => url,
    /**
     * The token the sync engine sends with each request. Cached until
     * shortly before it expires; concurrent requests share one fetch.
     */
    token: (): Promise<string> => {
      if (token && token.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
        return Promise.resolve(token.token);
      }
      fetchingToken ??= fetchToken();
      return fetchingToken;
    },
    /**
     * For a signed-in Believer, makes sure their cloud database exists (the
     * first call after sign-in creates it) and switches sync on. A Guest
     * stays paused without a network request. Returns whether sync is on.
     */
    connect: async (): Promise<boolean> => {
      if (url) {
        return true;
      }
      const requestedIn = session;
      if (!(await server.getCookie()) || requestedIn !== session) {
        return false;
      }
      const ensured = await server.ensureUserDatabase();
      if (requestedIn !== session) {
        return false;
      }
      ({ url } = ensured);
      return true;
    },
    /**
     * Sign-in and sign-out: sync pauses, nothing of the last Believer's
     * access stays, and requests still in flight for them are dropped when
     * they answer.
     */
    disconnect: (): void => {
      session += 1;
      url = null;
      token = null;
      fetchingToken = undefined;
    },
  };
};
