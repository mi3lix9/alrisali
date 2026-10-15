import { defineConfig } from "drizzle-kit";

// Generates SQL only (`bun run db:generate --name <change>`); `bun run
// db:bundle` then bundles it for the app (scripts/bundle-migrations.ts). The
// device runs the bundle; nothing here connects to a database.
export default defineConfig({
  schema: "./src/*/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
});
