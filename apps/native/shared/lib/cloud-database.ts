import { authClient } from "./auth-client";
import { createCloudDatabaseAccess } from "./cloud-database-access";
import { client } from "./orpc";

// The Believer's cloud database access (ADR-0001), over the device's auth
// session and oRPC client.
export const {
  url: cloudDatabaseUrl,
  token: cloudDatabaseToken,
  connect: connectCloudDatabase,
  disconnect: disconnectCloudDatabase,
} = createCloudDatabaseAccess({
  getCookie: () => authClient.getCookie(),
  ensureUserDatabase: () => client.account.ensureUserDatabase(),
  userDatabaseToken: () => client.account.userDatabaseToken(),
});
