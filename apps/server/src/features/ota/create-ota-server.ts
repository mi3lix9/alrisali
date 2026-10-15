import { s3Storage } from "@hot-updater/aws";
import { toolingTargetOf } from "@hot-updater/plugin-core";
import { createHotUpdater } from "@hot-updater/server";
import type { HotUpdaterHandlers } from "@hot-updater/server";
import { drizzleAdapter } from "@hot-updater/server/adapters/drizzle";
import { apiKeys } from "@hot-updater/server/plugins";

import type { OtaConfig } from "./ota-config";

/** The Hot Updater server, as the server app and its deploy step use it. */
export interface OtaServer {
  /** `client` serves the app's update checks; `admin` the `hot-updater` CLI. */
  readonly handlers: HotUpdaterHandlers;
  /**
   * Runs on every deploy, after the database migrations: writes Hot
   * Updater's schema settings rows and registers the client API key. Both
   * are idempotent.
   */
  readonly prepare: () => Promise<void>;
}

const CLIENT_API_KEY_NAME = "app";

/**
 * Update bundles in the Railway bucket, the Release Catalog in the server
 * database; client routes need the app's client API key (`x-api-key`).
 */
const hotUpdaterFor = (config: OtaConfig, db: unknown) => {
  const hotUpdater = createHotUpdater({
    database: drizzleAdapter({ db, provider: "sqlite" }),
    storage: s3Storage({
      bucketName: config.bucket,
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
    plugins: [apiKeys()],
  });
  const { createMigrator, generateSchema } = hotUpdater.database;
  if (!(createMigrator && generateSchema)) {
    throw new Error("Hot Updater's Drizzle adapter has no schema tooling.");
  }
  const target = toolingTargetOf(hotUpdater.plugins);
  return { hotUpdater, target, createMigrator, generateSchema };
};

export const createOtaServer = (config: OtaConfig, db: unknown): OtaServer => {
  const { hotUpdater, target, createMigrator } = hotUpdaterFor(config, db);
  return {
    handlers: hotUpdater.handlers,
    prepare: async () => {
      const migration = await createMigrator(target).migrateToLatest({
        updateSettings: true,
      });
      await migration.execute();
      await hotUpdater.api.apiKeys.register({
        apiKey: config.clientApiKey,
        name: CLIENT_API_KEY_NAME,
      });
    },
  };
};

/**
 * The Drizzle schema of Hot Updater's tables, which the server database's
 * migrations create (`packages/db-server/src/schema/hot-updater.ts`). It
 * depends on Hot Updater's version and plugins only.
 */
export const otaDrizzleSchema = (): string => {
  const placeholder = "schema";
  const { target, generateSchema } = hotUpdaterFor(
    {
      bucket: placeholder,
      endpoint: "http://localhost",
      region: "auto",
      accessKeyId: placeholder,
      secretAccessKey: placeholder,
      adminToken: placeholder,
      clientApiKey: placeholder,
    },
    null
  );
  return generateSchema("latest", undefined, target).code;
};
