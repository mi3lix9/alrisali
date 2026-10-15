import type { Database } from "@alrisali/db-server";
import * as schema from "@alrisali/db-server/schema/auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { eq } from "drizzle-orm";

import {
  APPLE_ID_ORIGIN,
  appleClientSecret,
  applePrivateKeyFromEnv,
} from "./apple-client-secret";
import { ADMIN_ROLE } from "./roles";

export { ADMIN_ROLE, isAdmin } from "./roles";

export interface AuthConfig {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  /**
   * Comma-separated Google OAuth client IDs whose ID tokens are accepted. The
   * first is the web client: the Admin web's Google sign-in uses it.
   */
  GOOGLE_CLIENT_IDS: string;
  /** The web client's secret; unset, the Admin web offers no Google sign-in. */
  GOOGLE_CLIENT_SECRET?: string | undefined;
  /** Comma-separated iOS bundle IDs: the audience of native Apple ID tokens. */
  APPLE_BUNDLE_IDS: string;
  /**
   * The Services ID of the Admin web's Sign in with Apple. With the Apple key
   * (team, key ID, .p8) it turns that sign-in on.
   */
  APPLE_WEB_SERVICES_ID?: string | undefined;
  APPLE_TEAM_ID?: string | undefined;
  APPLE_KEY_ID?: string | undefined;
  APPLE_PRIVATE_KEY?: string | undefined;
}

export const WEB_SIGN_IN_PROVIDERS = ["apple", "google"] as const;
export type WebSignInProvider = (typeof WEB_SIGN_IN_PROVIDERS)[number];

/** The providers the Admin web can sign in with: those fully configured. */
export const webSignInProviders = (env: AuthConfig): WebSignInProvider[] =>
  WEB_SIGN_IN_PROVIDERS.filter((provider) =>
    provider === "google"
      ? Boolean(env.GOOGLE_CLIENT_IDS.trim() && env.GOOGLE_CLIENT_SECRET)
      : Boolean(
          env.APPLE_WEB_SERVICES_ID &&
          env.APPLE_TEAM_ID &&
          env.APPLE_KEY_ID &&
          env.APPLE_PRIVATE_KEY
        )
  );

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
  const appleWeb =
    env.APPLE_WEB_SERVICES_ID &&
    env.APPLE_TEAM_ID &&
    env.APPLE_KEY_ID &&
    env.APPLE_PRIVATE_KEY
      ? {
          servicesId: env.APPLE_WEB_SERVICES_ID,
          key: {
            teamId: env.APPLE_TEAM_ID,
            keyId: env.APPLE_KEY_ID,
            privateKey: applePrivateKeyFromEnv(env.APPLE_PRIVATE_KEY),
          },
        }
      : undefined;
  const apple = {
    // The web flow's client is the Services ID; native ID tokens are for the
    // app's bundle IDs.
    clientId: appleWeb?.servicesId ?? appleBundleIds[0] ?? "",
    audience: appleWeb
      ? [...appleBundleIds, appleWeb.servicesId]
      : appleBundleIds,
    ...(verifyIdToken ? { verifyIdToken } : {}),
  };
  if (appleWeb) {
    // Apple's client secret is a short-lived JWT, minted whenever better-auth
    // reads it (it keeps this object, so the getter survives).
    Object.defineProperty(apple, "clientSecret", {
      enumerable: true,
      get: () => appleClientSecret(appleWeb.key, appleWeb.servicesId),
    });
  }

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
      // Apple posts the web sign-in's result back from its own origin.
      ...(appleWeb ? [APPLE_ID_ORIGIN] : []),
    ],
    // Believers use the native Apple and Google sheets, which hand the server
    // an ID token; Admins sign in to the web with the same providers (OAuth
    // redirect), so an Admin has one account on the phone and the web.
    socialProviders: {
      apple,
      google: {
        clientId: googleClientIds,
        ...(env.GOOGLE_CLIENT_SECRET
          ? { clientSecret: env.GOOGLE_CLIENT_SECRET }
          : {}),
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
    // The admin plugin's role marks Admins (better-auth keeps it on the user,
    // comma-separated when there are several).
    plugins: [expo(), admin({ adminRoles: [ADMIN_ROLE] })],
  });
};

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];

const setRole = async (
  database: Database,
  email: string,
  role: string | null
): Promise<void> => {
  const updated = await database
    .update(schema.user)
    .set({ role })
    .where(eq(schema.user.email, email))
    .returning({ id: schema.user.id });
  if (updated.length === 0) {
    throw new Error(`No account with the email ${email}: sign in once first`);
  }
};

/** Makes an existing account an Admin. */
export const grantAdminRole = (database: Database, email: string) =>
  setRole(database, email, ADMIN_ROLE);

/** Takes the Admin role away; the account stays a Believer. */
export const revokeAdminRole = (database: Database, email: string) =>
  setRole(database, email, null);
