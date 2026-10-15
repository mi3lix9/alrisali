import type { Database } from "@alrisali/db-server";
import * as schema from "@alrisali/db-server/schema/auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";

export interface AuthConfig {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  /** Comma-separated Google OAuth client IDs whose ID tokens are accepted. */
  GOOGLE_CLIENT_IDS: string;
  /** Comma-separated iOS bundle IDs: the audience of native Apple ID tokens. */
  APPLE_BUNDLE_IDS: string;
}

/**
 * Checks a provider's ID token signature and claims. Only tests replace the
 * providers' own verification (Apple's and Google's published keys).
 */
export type IdTokenVerifier = (
  token: string,
  nonce?: string
) => Promise<boolean>;

export interface AuthOptions {
  verifyIdToken?: IdTokenVerifier;
}

export const createAuth = (
  env: AuthConfig,
  database: Database,
  { verifyIdToken }: AuthOptions = {}
) => {
  const [appleBundleIds = [], googleClientIds = []] = [
    env.APPLE_BUNDLE_IDS,
    env.GOOGLE_CLIENT_IDS,
  ].map((ids) =>
    ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );

  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "sqlite",
      schema,
    }),
    trustedOrigins: [
      env.CORS_ORIGIN,
      "alrisali://",
      "exp://",
      "http://localhost:8081",
    ],
    // Admins sign in to the web with email and password; Believers use the
    // native Apple and Google sheets, which hand the server an ID token.
    emailAndPassword: { enabled: true },
    socialProviders: {
      apple: {
        clientId: appleBundleIds[0] ?? "",
        audience: appleBundleIds,
        ...(verifyIdToken ? { verifyIdToken } : {}),
      },
      google: {
        clientId: googleClientIds,
        ...(verifyIdToken ? { verifyIdToken } : {}),
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [expo()],
  });
};

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
