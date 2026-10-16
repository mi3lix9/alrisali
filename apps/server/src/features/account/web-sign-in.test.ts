import { generateKeyPairSync } from "node:crypto";

import {
  createAuth,
  devEmailPasswordEnabled,
  webSignInProviders,
} from "@alrisali/auth";
import type { AuthConfig } from "@alrisali/auth";
import { createDb } from "@alrisali/db-server";
import { migrateDb } from "@alrisali/db-server/migrate";
import { describe, expect, it, vi } from "vitest";

const PRIVATE_KEY = generateKeyPairSync("ec", { namedCurve: "P-256" })
  .privateKey.export({ format: "pem", type: "pkcs8" })
  .toString();

const NATIVE_ONLY: AuthConfig = {
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret",
  CORS_ORIGIN: "http://localhost:3001",
  GOOGLE_CLIENT_IDS:
    "web-client.apps.googleusercontent.com,ios-client.apps.googleusercontent.com",
  APPLE_BUNDLE_IDS: "com.alrisali.app",
};

const WEB: AuthConfig = {
  ...NATIVE_ONLY,
  GOOGLE_CLIENT_SECRET: "google-web-secret",
  APPLE_WEB_SERVICES_ID: "com.alrisali.web",
  APPLE_TEAM_ID: "TEAM123456",
  APPLE_KEY_ID: "KEY1234567",
  // As a host keeps it on one line.
  APPLE_PRIVATE_KEY: PRIVATE_KEY.replaceAll("\n", "\\n"),
};

const authFor = async (env: AuthConfig) => {
  const db = createDb({ DATABASE_URL: ":memory:", DATABASE_AUTH_TOKEN: "" });
  await migrateDb(db);
  return createAuth(env, db);
};

const CALLBACK = "http://localhost:3001/admin";

const authorizationUrl = async (env: AuthConfig, provider: string) => {
  const auth = await authFor(env);
  const { url } = await auth.api.signInSocial({
    body: { provider, callbackURL: CALLBACK },
  });
  return new URL(url ?? "");
};

const claimsOf = (jwt: string): unknown =>
  JSON.parse(Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString());

describe(webSignInProviders, () => {
  it("offers only the providers with web credentials", () => {
    expect(webSignInProviders(NATIVE_ONLY)).toStrictEqual([]);
    expect(
      webSignInProviders({ ...NATIVE_ONLY, GOOGLE_CLIENT_SECRET: "secret" })
    ).toStrictEqual(["google"]);
    expect(
      webSignInProviders({ ...WEB, APPLE_PRIVATE_KEY: undefined })
    ).toStrictEqual(["google"]);
    expect(webSignInProviders(WEB)).toStrictEqual(["apple", "google"]);
  });
});

describe("Admin web sign-in", () => {
  it("sends an Admin to Google with the web client", async () => {
    const url = await authorizationUrl(WEB, "google");

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe(
      "web-client.apps.googleusercontent.com"
    );
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/callback/google"
    );
  });

  it("sends an Admin to Apple with the Services ID", async () => {
    const url = await authorizationUrl(WEB, "apple");

    expect(url.origin).toBe("https://appleid.apple.com");
    expect(url.searchParams.get("client_id")).toBe("com.alrisali.web");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/callback/apple"
    );
  });

  it("mints Apple's client secret for the Services ID whenever it is used", async () => {
    const auth = await authFor(WEB);
    const context = await auth.$context;
    const apple = context.socialProviders.find(({ id }) => id === "apple");
    const options = apple?.options as { clientSecret?: string } | undefined;

    vi.useFakeTimers({ toFake: ["Date"], now: Date.UTC(2026, 9, 16) });
    const first = claimsOf(options?.clientSecret ?? "");
    vi.setSystemTime(Date.UTC(2027, 9, 16));
    const later = claimsOf(options?.clientSecret ?? "");
    vi.useRealTimers();

    expect(first).toMatchObject({
      iss: "TEAM123456",
      sub: "com.alrisali.web",
      aud: "https://appleid.apple.com",
      iat: Date.UTC(2026, 9, 16) / 1000,
    });
    expect(later).toMatchObject({ iat: Date.UTC(2027, 9, 16) / 1000 });
  });

  it("refuses the web flow for a provider without web credentials", async () => {
    await expect(authorizationUrl(NATIVE_ONLY, "google")).rejects.toThrow(
      "CLIENT_ID_AND_SECRET_REQUIRED"
    );
  });
});

const ADMIN = {
  email: "admin@example.com",
  password: "password-123",
  name: "Admin",
};

describe(devEmailPasswordEnabled, () => {
  it("is on outside production unless turned off", () => {
    expect(devEmailPasswordEnabled({ NODE_ENV: "development" })).toBeTruthy();
    expect(devEmailPasswordEnabled({ NODE_ENV: "test" })).toBeTruthy();
    expect(
      devEmailPasswordEnabled({
        NODE_ENV: "development",
        AUTH_DEV_EMAIL_PASSWORD: false,
      })
    ).toBeFalsy();
  });

  it("is off in production", () => {
    expect(devEmailPasswordEnabled({ NODE_ENV: "production" })).toBeFalsy();
    expect(
      devEmailPasswordEnabled({
        NODE_ENV: "production",
        AUTH_DEV_EMAIL_PASSWORD: false,
      })
    ).toBeFalsy();
  });

  it("refuses to start production with it turned on", () => {
    expect(() =>
      createAuth(
        { ...WEB, NODE_ENV: "production", AUTH_DEV_EMAIL_PASSWORD: true },
        createDb({ DATABASE_URL: ":memory:", DATABASE_AUTH_TOKEN: "" })
      )
    ).toThrow("AUTH_DEV_EMAIL_PASSWORD");
  });
});

describe("email and password sign-in", () => {
  it("signs up and in during local development", async () => {
    const auth = await authFor({ ...WEB, NODE_ENV: "development" });

    await auth.api.signUpEmail({ body: ADMIN });

    await expect(
      auth.api.signInEmail({
        body: { email: ADMIN.email, password: ADMIN.password },
      })
    ).resolves.toMatchObject({ user: { email: ADMIN.email } });
  });

  it("does not exist in production", async () => {
    const auth = await authFor({ ...WEB, NODE_ENV: "production" });

    await expect(auth.api.signUpEmail({ body: ADMIN })).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(
      auth.api.signInEmail({
        body: { email: ADMIN.email, password: ADMIN.password },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
