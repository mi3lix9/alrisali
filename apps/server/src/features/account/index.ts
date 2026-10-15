import { deleteAccount } from "./delete-account";
import { privateData } from "./private-data";
import { ensureUserDatabase, userDatabaseToken } from "./user-database";

export const accountRouter = {
  privateData,
  ensureUserDatabase,
  userDatabaseToken,
  deleteAccount,
};

export { createUserDatabaseHost } from "./host-from-env";
export { createLocalSyncHost } from "./local-sync-host";
export { createTursoHost } from "./turso-host";
