import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { createAuth } from "@alrisali/auth";
import type { Auth } from "@alrisali/auth";
import { createDb } from "@alrisali/db-server";
import type { Database } from "@alrisali/db-server";
import { migrateDb } from "@alrisali/db-server/migrate";
import { believerDatabase } from "@alrisali/db-server/schema/believer-database";
import { startSyncServer, temporaryDirectory } from "@alrisali/db-user/testing";
import type { SyncServer, TemporaryDirectory } from "@alrisali/db-user/testing";
import { call, isProcedure } from "@orpc/server";
import type { AnyProcedure } from "@orpc/server";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { createLocalSyncHost, createTursoHost } from "@/features/account";
import type { RecitationSource } from "@/shared/lib/recitation-source";
import type { UserDatabaseHost } from "@/shared/lib/user-database-host";

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
  "account.ensureUserDatabase": { access: "believer" },
  "account.userDatabaseToken": { access: "believer" },
  "quran.reciters": { access: "anonymous" },
  "quran.surahAudio": {
    access: "anonymous",
    input: { reciterId: 7, surah: 1 },
  },
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

// Stand-in for the Quran Foundation audio API.
const recitation: RecitationSource = {
  reciters: () =>
    Promise.resolve([
      {
        id: 7,
        name: { ar: "مشاري العفاسي", en: "Mishary Alafasy" },
        style: null,
      },
    ]),
  surahAudio: (reciterId, surah) =>
    Promise.resolve([
      {
        ayah: `${surah}:1`,
        url: `https://verses.quran.foundation/${reciterId}/001001.mp3`,
      },
    ]),
};

const pathsFor = (access: Access): string[] =>
  PROCEDURES.map(([path]) => path).filter(
    (path) => ACCESS[path]?.access === access
  );

let db: Database;
let auth: Auth;
let userDatabases: UserDatabaseHost;

// A local `tursodb --sync-server` stands in for Turso Cloud.
let syncServer: SyncServer;
let syncServerDirectory: TemporaryDirectory;

const startLocalCloud = async () => {
  syncServerDirectory = temporaryDirectory();
  syncServer = await startSyncServer({ directory: syncServerDirectory.path });
};

const stopLocalCloud = async () => {
  await syncServer.stop();
  syncServerDirectory.remove();
};

const setUp = async (host?: UserDatabaseHost) => {
  db = createDb({ DATABASE_URL: ":memory:", DATABASE_AUTH_TOKEN: "" });
  await migrateDb(db);
  auth = createAuth(TEST_ENV, db, {
    verifyIdToken: (token) =>
      Promise.resolve(token.endsWith(`.${PROVIDER_SIGNATURE}`)),
  });
  userDatabases = host ?? createLocalSyncHost({ baseUrl: syncServer.baseUrl });
};

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
  const context = await createContext({
    auth,
    db,
    userDatabases,
    recitation,
    headers,
  });
  return call(entry[1], ACCESS[path]?.input, { context });
};

const googleBeliever = {
  sub: "google-123",
  email: "zainab@example.com",
  email_verified: true,
  name: "Zainab",
};

describe("auth guards", () => {
  beforeAll(startLocalCloud);
  beforeEach(() => setUp());

  afterAll(stopLocalCloud);

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

/** The claims of an unsigned (local) or Turso-issued JWT. */
const claimsOf = (token: string): Record<string, unknown> =>
  JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());

const otherBeliever = {
  sub: "google-456",
  email: "hasan@example.com",
  email_verified: true,
  name: "Hasan",
};

const ensure = async (headers: Headers) =>
  (await callAs(headers, "account.ensureUserDatabase")) as { url: string };
const token = async (headers: Headers) =>
  (await callAs(headers, "account.userDatabaseToken")) as {
    token: string;
    expiresAt: number;
  };
const nameIn = (url: string) => url.split("/").at(-1) ?? "";

describe("Believer cloud databases on the local sync server", () => {
  beforeAll(startLocalCloud);
  beforeEach(() => setUp());

  afterAll(stopLocalCloud);

  it("creates the Believer's database once, however often it is asked", async () => {
    const headers = await signIn("google", idToken(googleBeliever));

    const [first, concurrent] = await Promise.all([
      ensure(headers),
      ensure(headers),
    ]);
    const again = await ensure(headers);

    expect(concurrent).toStrictEqual(first);
    expect(again).toStrictEqual(first);
    expect(first.url.startsWith(`${syncServer.baseUrl}/db/`)).toBeTruthy();
    await expect(db.select().from(believerDatabase)).resolves.toHaveLength(1);
    // The database exists on the server, not only in the server's records.
    await expect(
      syncServer.query(nameIn(first.url), "SELECT 1")
    ).resolves.toStrictEqual([[1]]);
  });

  it("gives each Believer their own database", async () => {
    const zainab = await ensure(
      await signIn("google", idToken(googleBeliever))
    );
    const hasan = await ensure(await signIn("google", idToken(otherBeliever)));

    expect(hasan.url).not.toBe(zainab.url);
  });

  it("mints short-lived tokens for the caller's database only", async () => {
    const zainab = await signIn("google", idToken(googleBeliever));
    const hasan = await signIn("google", idToken(otherBeliever));
    const before = Date.now();

    const zainabToken = await token(zainab);
    const hasanToken = await token(hasan);

    const zainabDatabase = await ensure(zainab);
    const hasanDatabase = await ensure(hasan);

    expect(claimsOf(zainabToken.token)).toMatchObject({
      db: nameIn(zainabDatabase.url),
    });
    expect(claimsOf(hasanToken.token)).toMatchObject({
      db: nameIn(hasanDatabase.url),
    });
    expect(zainabToken.expiresAt).toBeGreaterThan(before);
    expect(zainabToken.expiresAt).toBeLessThanOrEqual(
      Date.now() + 60 * 60 * 1000
    );
  });
});

/**
 * A stand-in for Turso's Platform API: databases by name, 409 on a second
 * create, and a token per database that records which one it opens.
 */
const fakePlatformApi = async () => {
  const databases = new Map<string, string>();
  const tokenRequests: { database: string; query: string }[] = [];
  const createdInGroups: string[] = [];
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "", "http://localhost");
    const send = (status: number, body: unknown) => {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    };
    const match =
      /^\/v1\/organizations\/alrisali\/databases(?:\/(?<name>[^/]+))?(?<tokens>\/auth\/tokens)?$/u.exec(
        url.pathname
      );
    if (!match || request.headers.authorization !== "Bearer platform-token") {
      send(match ? 401 : 404, { error: "no" });
      return;
    }
    const { name, tokens } = match.groups ?? {};
    if (request.method === "POST" && !name) {
      const chunks: Buffer[] = [];
      for await (const chunk of request) {
        chunks.push(chunk as Buffer);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString()) as {
        name: string;
        group: string;
      };
      createdInGroups.push(body.group);
      if (databases.has(body.name)) {
        send(409, { error: `database with name ${body.name} already exists` });
        return;
      }
      const hostname = `${body.name}-alrisali.aws-eu-west-1.turso.io`;
      databases.set(body.name, hostname);
      send(200, {
        database: { DbId: body.name, Hostname: hostname, Name: body.name },
      });
      return;
    }
    const hostname = name ? databases.get(name) : undefined;
    if (!name || !hostname) {
      send(404, { error: "database not found" });
      return;
    }
    if (request.method === "POST" && tokens) {
      tokenRequests.push({ database: name, query: url.search });
      send(200, { jwt: `jwt-for-${name}` });
      return;
    }
    send(200, { database: { DbId: name, Hostname: hostname, Name: name } });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1/`,
    databases,
    tokenRequests,
    createdInGroups,
    close: () => {
      server.close();
    },
  };
};

describe("Believer cloud databases on Turso Cloud (Platform API)", () => {
  let platform: Awaited<ReturnType<typeof fakePlatformApi>>;

  beforeEach(async () => {
    platform = await fakePlatformApi();
    await setUp(
      createTursoHost({
        org: "alrisali",
        apiToken: "platform-token",
        group: "believers",
        baseUrl: platform.baseUrl,
      })
    );
  });

  afterEach(() => {
    platform.close();
  });

  it("creates one database in the group, and reuses it after a lost reply", async () => {
    const headers = await signIn("google", idToken(googleBeliever));

    const first = await callAs(headers, "account.ensureUserDatabase");
    // The server lost its record (say, a crash after creating): create
    // answers 409 and the existing database is used.
    await db.delete(believerDatabase);
    const again = await callAs(headers, "account.ensureUserDatabase");

    expect(platform.databases.size).toBe(1);
    expect(platform.createdInGroups).toStrictEqual(["believers", "believers"]);
    const [hostname] = platform.databases.values();
    expect(first).toStrictEqual({ url: `https://${hostname}` });
    expect(again).toStrictEqual(first);
  });

  it("mints an hour-long full-access token for the caller's database only", async () => {
    const zainab = await signIn("google", idToken(googleBeliever));
    const hasan = await signIn("google", idToken(otherBeliever));

    const zainabToken = await callAs(zainab, "account.userDatabaseToken");
    await callAs(hasan, "account.userDatabaseToken");

    const [zainabDatabase, hasanDatabase] = platform.databases.keys();
    expect(zainabToken).toMatchObject({ token: `jwt-for-${zainabDatabase}` });
    expect(platform.tokenRequests).toStrictEqual([
      {
        database: zainabDatabase,
        query: "?expiration=60m&authorization=full-access",
      },
      {
        database: hasanDatabase,
        query: "?expiration=60m&authorization=full-access",
      },
    ]);
  });
});
