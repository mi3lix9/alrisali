// Test support for other packages (the server's router tests): a local
// `tursodb --sync-server` and temporary directories. Never bundled.
export { startSyncServer, temporaryDirectory } from "../shared/testing";
export type { SyncServer, TemporaryDirectory } from "../shared/testing";
