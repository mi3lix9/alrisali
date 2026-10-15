import { createAuth } from "@alrisali/auth";
import type { Auth } from "@alrisali/auth";
import { createDb } from "@alrisali/db-server";
import type { Database } from "@alrisali/db-server";
import { migrateDb } from "@alrisali/db-server/migrate";
import { call, isProcedure } from "@orpc/server";
import type { AnyProcedure } from "@orpc/server";
import { beforeEach, describe, expect, it } from "vitest";

import { createContext } from "./context";
import { appRouter } from "./router";

type Access = "anonymous" | "believer";

/**
 * Who may call each procedure, and a valid input for it. Every procedure in
 * the router is listed here: adding one without its rule fails the suite.
 */
const ACCESS: Record<string, { access: Access; input?: unknown }> = {
  healthCheck: { access: "anonymous" },
  "account.privateData": { access: "believer" },
};

const proceduresOf = (
  router: object,
  prefix: string[] = []
): [string, AnyProcedure][] =>
  Object.entries(router).flatMap(([key, value]): [string, AnyProcedure][] => {
    const path = [...prefix, key];
    if (isProcedure(value)) {
      return [[path.join("."), value]];
    }
    return typeof value === "object" && value !== null
      ? proceduresOf(value, path)
      : [];
  });

const PROCEDURES = proceduresOf(appRouter);

// Stand-in for Apple's and Google's signature checks: a token "signed" by the
// provider ends in this signature segment.
const PROVIDER_SIGNATURE = "signed-by-provider";

const idToken = (
  claims: Record<string, unknown>,
  signature = PROVIDER_SIGNATURE
): string =>
  [
    ...[{ alg: "RS256" }, claims].map((part) =>
      Buffer.from(JSON.stringify(part)).toString("base64url")
    ),
    signature,
  ].join(".");

const TEST_ENV = {
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret",
  CORS_ORIGIN: "http://localhost:3001",
  GOOGLE_CLIENT_IDS: "web-client.apps.googleusercontent.com",
  APPLE_BUNDLE_IDS: "com.alrisali.app",
};

const pathsFor = (access: Access): string[] =>
  PROCEDURES.map(([path]) => path).filter(
    (path) => ACCESS[path]?.access === access
  );

let db: Database;
let auth: Auth;

type Provider = "apple" | "google";
interface AppleUser {
  name: { firstName: string; lastName: string };
}

/** Signs in through the native-sheet path; returns the session's cookies. */
const signIn = async (
  provider: Provider,
  token: string,
  user?: AppleUser
): Promise<Headers> => {
  const { headers } = await auth.api.signInSocial({
    body: { provider, idToken: { token, ...(user ? { user } : {}) } },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
};

const callAs = async (headers: Headers, path: string) => {
  const entry = PROCEDURES.find(([name]) => name === path);
  if (!entry) {
    throw new Error(`No procedure ${path}`);
  }
  const context = await createContext({ auth, db, headers });
  return call(entry[1], ACCESS[path]?.input, { context });
};

const googleBeliever = {
  sub: "google-123",
  email: "zainab@example.com",
  email_verified: true,
  name: "Zainab",
};

describe("auth guards", () => {
  beforeEach(async () => {
    db = createDb({ DATABASE_URL: ":memory:", DATABASE_AUTH_TOKEN: "" });
    await migrateDb(db);
    auth = createAuth(TEST_ENV, db, {
      verifyIdToken: (token) =>
        Promise.resolve(token.endsWith(`.${PROVIDER_SIGNATURE}`)),
    });
  });

  it("lists an access rule for every procedure", () => {
    expect(PROCEDURES.map(([path]) => path).toSorted()).toStrictEqual(
      Object.keys(ACCESS).toSorted()
    );
  });

  it.each(pathsFor("anonymous"))(
    "%s answers an anonymous caller",
    async (path) => {
      await expect(callAs(new Headers(), path)).resolves.toBeDefined();
    }
  );

  it.each(pathsFor("believer"))(
    "%s refuses an anonymous caller",
    async (path) => {
      await expect(callAs(new Headers(), path)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }
  );

  it.each(PROCEDURES.map(([path]) => path))(
    "%s answers a Believer signed in with Google",
    async (path) => {
      const headers = await signIn("google", idToken(googleBeliever));
      await expect(callAs(headers, path)).resolves.toBeDefined();
    }
  );

  it("knows the Believer behind a Google session", async () => {
    const headers = await signIn("google", idToken(googleBeliever));
    await expect(callAs(headers, "account.privateData")).resolves.toMatchObject(
      { user: { email: "zainab@example.com", name: "Zainab" } }
    );
  });

  it("keeps the name Apple sends only on a Believer's first sign-in", async () => {
    const appleToken = idToken({
      sub: "apple-001",
      email: "ali@privaterelay.appleid.com",
      email_verified: "true",
    });
    await signIn("apple", appleToken, {
      name: { firstName: "Ali", lastName: "Hasan" },
    });
    const again = await signIn("apple", appleToken);

    await expect(callAs(again, "account.privateData")).resolves.toMatchObject({
      user: { email: "ali@privaterelay.appleid.com", name: "Ali Hasan" },
    });
  });

  it("refuses an ID token the provider did not sign", async () => {
    await expect(
      signIn("google", idToken(googleBeliever, "forged"))
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("treats a signed-out Believer as anonymous", async () => {
    const headers = await signIn("google", idToken(googleBeliever));
    await auth.api.signOut({ headers });

    await expect(callAs(headers, "account.privateData")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
