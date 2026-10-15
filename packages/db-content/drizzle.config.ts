import { defineConfig } from "drizzle-kit";

// Generates SQL only (`bun run db:generate --name <change>`); `bun run
// db:bundle` then bundles it for the server, which migrates the content
// database. Devices never migrate it: they pull the schema with the content.
export default defineConfig({
  schema: "./src/*/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
});
