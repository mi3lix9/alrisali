// The `hot-updater` CLI's configuration: builds the JavaScript bundle with
// Expo, uploads it to the Railway bucket and records the release through the
// server's admin routes. Run it with `bun run ota:deploy` (see README).
//
// Expo prebuild (every EAS build) also loads this file, for `updateStrategy`
// only, without the deploy credentials: they are read when the CLI uses them.
import { s3Storage } from "@hot-updater/aws";
import { expo } from "@hot-updater/expo";
import { standaloneRepository } from "@hot-updater/standalone";
import { defineConfig } from "hot-updater";
import { apiKeys } from "hot-updater/plugins";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}: the \`hot-updater\` CLI needs it.`);
  }
  return value;
};

export default defineConfig({
  build: expo(),
  storage: s3Storage({
    bucketName: process.env.HOT_UPDATER_BUCKET ?? "",
    endpoint: process.env.HOT_UPDATER_BUCKET_ENDPOINT,
    region: process.env.HOT_UPDATER_BUCKET_REGION ?? "auto",
    // Resolved on the first upload, so a missing variable is named there.
    credentials: () => {
      required("HOT_UPDATER_BUCKET");
      required("HOT_UPDATER_BUCKET_ENDPOINT");
      return Promise.resolve({
        accessKeyId: required("HOT_UPDATER_BUCKET_ACCESS_KEY_ID"),
        secretAccessKey: required("HOT_UPDATER_BUCKET_SECRET_ACCESS_KEY"),
      });
    },
  }),
  database: standaloneRepository({
    baseUrl: `${process.env.EXPO_PUBLIC_SERVER_URL ?? ""}/hot-updater/admin`,
    commonHeaders: {
      // Read on each request, so a missing token is named there.
      get Authorization() {
        return `Bearer ${required("HOT_UPDATER_ADMIN_TOKEN")}`;
      },
    },
  }),
  // The server's plugins (apps/server/src/features/ota).
  plugins: [apiKeys()],
  updateStrategy: "appVersion",
});
