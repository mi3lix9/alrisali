// Development stand-in for Turso Cloud: serves Believers' databases from
// .sync-server/ at http://127.0.0.1:8090 (the server's default
// LOCAL_SYNC_SERVER_URL). Set SYNC_SERVER_HOST=0.0.0.0 for a physical device
// or the Android emulator. No tokens are checked.
import path from "node:path";

import { startSyncServer } from "../src/shared/sync-server";

const server = await startSyncServer({
  directory: path.join(import.meta.dirname, "..", ".sync-server"),
  host: process.env.SYNC_SERVER_HOST ?? "127.0.0.1",
  port: Number(process.env.SYNC_SERVER_PORT ?? 8090),
});
console.log(`tursodb --sync-server at ${server.baseUrl}/db/<name>`);

const stop = async () => {
  await server.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
