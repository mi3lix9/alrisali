// Writes the Drizzle schema of Hot Updater's tables into the server database
// package. Run it after upgrading Hot Updater, then `bun run db:generate`.
import { fileURLToPath } from "node:url";

import { otaDrizzleSchema } from "@/features/ota";

const SCHEMA_FILE = fileURLToPath(
  new URL(
    "../../../../packages/db-server/src/schema/hot-updater.ts",
    import.meta.url
  )
);

await Bun.write(SCHEMA_FILE, otaDrizzleSchema());
console.log(`Wrote ${SCHEMA_FILE}`);
