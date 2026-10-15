import { deleteAccount } from "./delete-account";
import { privateData } from "./private-data";
import { ensureUserDatabase, userDatabaseToken } from "./user-database";
import { webSignInProviders } from "./web-sign-in-providers";

export const accountRouter = {
  privateData,
  ensureUserDatabase,
  userDatabaseToken,
  deleteAccount,
  webSignInProviders,
};

export { createAppleRevokerFromEnv } from "./apple-sign-in";
export { createUserDatabaseHost } from "./host-from-env";
export { createLocalSyncHost } from "./local-sync-host";
export { createTursoHost } from "./turso-host";
