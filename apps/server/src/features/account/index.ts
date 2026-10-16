import { deleteAccount } from "./delete-account";
import { privateData } from "./private-data";
import { signInOptions } from "./sign-in-options";
import { ensureUserDatabase, userDatabaseToken } from "./user-database";

export const accountRouter = {
  privateData,
  ensureUserDatabase,
  userDatabaseToken,
  deleteAccount,
  signInOptions,
};

export { createAppleRevokerFromEnv } from "./apple-sign-in";
export { createUserDatabaseHost } from "./host-from-env";
export { createLocalSyncHost } from "./local-sync-host";
export { createTursoHost } from "./turso-host";
