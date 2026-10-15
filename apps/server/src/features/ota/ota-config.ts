/** What the Hot Updater server needs: the Railway bucket and two keys. */
export interface OtaConfig {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Bearer token the `hot-updater` CLI sends to the admin routes. */
  adminToken: string;
  /** The key the app sends in `x-api-key` on update checks. */
  clientApiKey: string;
}

/** The server's environment variables that configure over-the-air updates. */
export interface OtaEnv {
  HOT_UPDATER_BUCKET?: string;
  HOT_UPDATER_BUCKET_ENDPOINT?: string;
  HOT_UPDATER_BUCKET_REGION?: string;
  HOT_UPDATER_BUCKET_ACCESS_KEY_ID?: string;
  HOT_UPDATER_BUCKET_SECRET_ACCESS_KEY?: string;
  HOT_UPDATER_ADMIN_TOKEN?: string;
  HOT_UPDATER_CLIENT_API_KEY?: string;
}

const KEYS = {
  bucket: "HOT_UPDATER_BUCKET",
  endpoint: "HOT_UPDATER_BUCKET_ENDPOINT",
  region: "HOT_UPDATER_BUCKET_REGION",
  accessKeyId: "HOT_UPDATER_BUCKET_ACCESS_KEY_ID",
  secretAccessKey: "HOT_UPDATER_BUCKET_SECRET_ACCESS_KEY",
  adminToken: "HOT_UPDATER_ADMIN_TOKEN",
  clientApiKey: "HOT_UPDATER_CLIENT_API_KEY",
} as const satisfies Record<keyof OtaConfig, keyof OtaEnv>;

/**
 * Reads the OTA configuration. `undefined` when none of it is set (local
 * development without a bucket); throws naming every missing variable when
 * only part of it is set.
 */
export const readOtaConfig = (env: OtaEnv): OtaConfig | undefined => {
  const entries = Object.entries(KEYS) as [keyof OtaConfig, keyof OtaEnv][];
  const missing = entries.filter(([, key]) => !env[key]).map(([, key]) => key);
  if (missing.length === entries.length) {
    return undefined;
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(", ")}: over-the-air updates need every HOT_UPDATER_* variable.`
    );
  }
  return Object.fromEntries(
    entries.map(([field, key]) => [field, env[key]])
  ) as unknown as OtaConfig;
};

/** Like `readOtaConfig`, for tasks that cannot run without it. */
export const requireOtaConfig = (env: OtaEnv): OtaConfig => {
  const config = readOtaConfig(env);
  if (!config) {
    throw new Error(
      `Missing ${Object.values(KEYS).join(", ")}: over-the-air updates are not configured.`
    );
  }
  return config;
};
