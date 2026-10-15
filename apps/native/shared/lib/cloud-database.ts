import { authClient } from "./auth-client";
import { client } from "./orpc";

/**
 * Where the signed-in Believer's cloud database is and how to open it
 * (ADR-0001). The server creates the database and mints short-lived tokens
 * scoped to it; this keeps both in memory, so a Guest (or a signed-out
 * Believer) has no URL and their sync stays paused.
 */

/** Fetch a new token this long before the current one expires. */
const TOKEN_REFRESH_MARGIN_MS = 60_000;

let url: string | null = null;
let token: { token: string; expiresAt: number } | null = null;
let fetchingToken: Promise<string> | undefined;

/** The sync URL, or null while the Believer is a Guest. */
export const cloudDatabaseUrl = (): string | null => url;

const fetchToken = async (): Promise<string> => {
  try {
    token = await client.account.userDatabaseToken();
    return token.token;
  } finally {
    fetchingToken = undefined;
  }
};

/**
 * The token the sync engine sends with each request. Cached until shortly
 * before it expires; concurrent requests share one fetch.
 */
export const cloudDatabaseToken = (): Promise<string> => {
  if (token && token.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
    return Promise.resolve(token.token);
  }
  fetchingToken ??= fetchToken();
  return fetchingToken;
};

/**
 * For a signed-in Believer, makes sure their cloud database exists (the
 * first call after sign-in creates it) and switches sync on. A Guest stays
 * paused without a network request. Returns whether sync is on.
 */
export const connectCloudDatabase = async (): Promise<boolean> => {
  if (url) {
    return true;
  }
  if (!(await authClient.getCookie())) {
    return false;
  }
  ({ url } = await client.account.ensureUserDatabase());
  return true;
};

/** Sign-out: sync pauses and nothing of the last Believer's access stays. */
export const disconnectCloudDatabase = (): void => {
  url = null;
  token = null;
};
