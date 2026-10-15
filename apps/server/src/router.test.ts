import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { createAuth, grantAdminRole, revokeAdminRole } from "@alrisali/auth";
import type { Auth } from "@alrisali/auth";
import {
  ContentReplicaReadOnlyError,
  createGlobalSettingsRepository,
  globalSettings,
  openContentReplica,
} from "@alrisali/db-content/shared";
import { connectNodeReplica } from "@alrisali/db-content/testing";
import { createDb } from "@alrisali/db-server";
import type { Database } from "@alrisali/db-server";
import { migrateDb } from "@alrisali/db-server/migrate";
import { analyticsEvent } from "@alrisali/db-server/schema/analytics";
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
import { createContentDatabase } from "@/shared/lib/content-database";
import type { ContentDatabase } from "@/shared/lib/content-database";
import type { RecitationSource } from "@/shared/lib/recitation-source";
import type { UserDatabaseHost } from "@/shared/lib/user-database-host";

import { createContext } from "./context";
import { appRouter } from "./router";

type Access = "anonymous" | "believer" | "admin";

const INSTALL_ID = "0b6f4f8e-6a43-4c5e-9d5a-3f1e2c7a9b10";

/** A device's batch of usage events: one screen view, one feature use. */
const analyticsBatch = (installId = INSTALL_ID) => ({
  installId,
  device: {
    platform: "ios",
    osVersion: "26.1",
    appVersion: "2.0.0",
    deviceType: "phone",
    birthYear: null,
  },
  events: [
    {
      id: "6f1c2b9e-0d3a-4e8f-a1b2-c3d4e5f60718",
      type: "screen_view",
      name: "quran",
      occurredAt: Date.now(),
    },
    {
      id: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
      type: "feature_use",
      name: "prayer-log",
      occurredAt: Date.now(),
      data: { salah: "fajr" },
    },
  ],
});

/**
 * Who may call each procedure, and a valid input for it. Every procedure in
 * the router is listed here: adding one without its rule fails the suite.
 */
const ACCESS: Record<string, { access: Access; input?: unknown }> = {
  healthCheck: { access: "anonymous" },
  contentReplica: { access: "anonymous" },
  "account.privateData": { access: "believer" },
  "account.ensureUserDatabase": { access: "believer" },
  "account.userDatabaseToken": { access: "believer" },
  "account.deleteAccount": { access: "believer" },
  "analytics.track": { access: "anonymous", input: analyticsBatch() },
  "analytics.summary": { access: "admin" },
  "analytics.popularSections": { access: "admin", input: { days: 7 } },
  "analytics.dailyActiveUsers": {
    access: "admin",
    input: { days: 7, offset: 0 },
  },
  "analytics.featureUsage": { access: "admin", input: { days: 7 } },
  "analytics.retention": { access: "admin", input: { cohortDays: 30 } },
  "analytics.guestShare": { access: "admin", input: { days: 30 } },
  "analytics.devices": { access: "admin", input: { days: 30 } },
  "analytics.ages": { access: "admin", input: { days: 30 } },
  "hijriAdjustment.get": { access: "admin" },
  "hijriAdjustment.set": { access: "admin", input: { adjustment: 1 } },
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

const pathsFor = (...access: Access[]): string[] =>
  PROCEDURES.map(([path]) => path).filter((path) =>
    access.includes(ACCESS[path]?.access ?? "admin")
  );

let db: Database;
let auth: Auth;
let userDatabases: UserDatabaseHost;
let content: ContentDatabase;

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

let contentDatabases = 0;

const setUp = async (host?: UserDatabaseHost) => {
  db = createDb({ DATABASE_URL: ":memory:", DATABASE_AUTH_TOKEN: "" });
  await migrateDb(db);
  auth = createAuth(TEST_ENV, db, {
    verifyIdToken: (token) =>
      Promise.resolve(token.endsWith(`.${PROVIDER_SIGNATURE}`)),
  });
  userDatabases = host ?? createLocalSyncHost({ baseUrl: syncServer.baseUrl });
  // A fresh content database per test, so no test sees another's content.
  contentDatabases += 1;
  content = createContentDatabase({
    host: userDatabases,
    name: `content-${process.pid}-${contentDatabases}`,
  });
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

const callAs = async (headers: Headers, path: string, input?: unknown) => {
  const entry = PROCEDURES.find(([name]) => name === path);
  if (!entry) {
    throw new Error(`No procedure ${path}`);
  }
  const context = await createContext({
    auth,
    db,
    userDatabases,
    content,
    recitation,
    headers,
  });
  return call(entry[1], input ?? ACCESS[path]?.input, { context });
};

const adminBeliever = {
  sub: "google-789",
  email: "fatima@alrisali.org",
  email_verified: true,
  name: "Fatima",
};

/** Signs in with Google and makes that account an Admin. */
const signInAsAdmin = async (): Promise<Headers> => {
  const headers = await signIn("google", idToken(adminBeliever));
  await grantAdminRole(db, adminBeliever.email);
  return headers;
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

  it.each(pathsFor("believer", "admin"))(
    "%s refuses an anonymous caller",
    async (path) => {
      await expect(callAs(new Headers(), path)).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }
  );

  it.each(pathsFor("anonymous", "believer"))(
    "%s answers a Believer signed in with Google",
    async (path) => {
      const headers = await signIn("google", idToken(googleBeliever));
      await expect(callAs(headers, path)).resolves.toBeDefined();
    }
  );

  it.each(pathsFor("admin"))("%s refuses a Believer", async (path) => {
    const headers = await signIn("google", idToken(googleBeliever));
    await expect(callAs(headers, path)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it.each(PROCEDURES.map(([path]) => path))(
    "%s answers an Admin",
    async (path) => {
      const headers = await signInAsAdmin();
      await expect(callAs(headers, path)).resolves.toBeDefined();
    }
  );

  it("refuses a Believer whose Admin role was taken away", async () => {
    const headers = await signInAsAdmin();
    await revokeAdminRole(db, adminBeliever.email);

    await expect(callAs(headers, "hijriAdjustment.get")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

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

interface ReplicaAccess {
  url: string;
  token: string;
  expiresAt: number;
}

/**
 * A device (a Guest's, even) opening its pull-only content replica. It knows
 * the content database's URL only while `online()` says so.
 */
const openDeviceReplica = async (
  directory: TemporaryDirectory,
  online: () => boolean
) => {
  const access = (await callAs(
    new Headers(),
    "contentReplica"
  )) as ReplicaAccess;
  const replica = await openContentReplica({
    path: `${directory.path}/content.db`,
    remoteUrl: () => (online() ? access.url : null),
    authToken: () => Promise.resolve(access.token),
    connect: connectNodeReplica,
  });
  return { access, replica };
};

const setAdjustment = async (admin: Headers, adjustment: number) => {
  await callAs(admin, "hijriAdjustment.set", { adjustment });
};

describe("content replica", () => {
  let device: TemporaryDirectory;

  beforeAll(startLocalCloud);
  beforeEach(async () => {
    await setUp();
    device = temporaryDirectory();
  });

  afterEach(() => {
    device.remove();
  });

  afterAll(stopLocalCloud);

  it("reads the default before a device's first pull, and the Admins' Hijri Adjustment after it", async () => {
    await setAdjustment(await signInAsAdmin(), -1);
    let online = false;
    const { replica } = await openDeviceReplica(device, () => online);
    const settings = createGlobalSettingsRepository(replica.db);

    await expect(settings.hijriAdjustment()).resolves.toBe(0);
    online = true;
    await replica.sync();
    await expect(settings.hijriAdjustment()).resolves.toBe(-1);
    await replica.close();
  });

  it("shows a changed Hijri Adjustment after the device's next sync", async () => {
    const admin = await signInAsAdmin();
    await setAdjustment(admin, -1);
    const { replica } = await openDeviceReplica(device, () => true);
    const settings = createGlobalSettingsRepository(replica.db);
    await replica.sync();

    await setAdjustment(admin, 2);

    await expect(settings.hijriAdjustment()).resolves.toBe(-1);
    await expect(replica.sync()).resolves.toStrictEqual({
      status: "pulled",
      pulledChanges: true,
    });
    await expect(settings.hijriAdjustment()).resolves.toBe(2);
    await replica.close();
  });

  it("keeps the pulled Hijri Adjustment offline", async () => {
    await setAdjustment(await signInAsAdmin(), 2);
    const { replica } = await openDeviceReplica(device, () => true);
    await replica.sync();
    await replica.close();

    // The next launch has no URL yet: it makes no request and reads the copy.
    const { replica: offline } = await openDeviceReplica(device, () => false);

    await expect(offline.sync()).resolves.toStrictEqual({ status: "paused" });
    await expect(
      createGlobalSettingsRepository(offline.db).hijriAdjustment()
    ).resolves.toBe(2);
    await offline.close();
  });

  it("refuses every write on a device's replica", async () => {
    const admin = await signInAsAdmin();
    await setAdjustment(admin, 1);
    const { replica } = await openDeviceReplica(device, () => true);
    await replica.sync();

    // Drizzle reports the refusal as the cause of its query error.
    const refused = { cause: expect.any(ContentReplicaReadOnlyError) };
    await expect(
      createGlobalSettingsRepository(replica.db).setHijriAdjustment(-2)
    ).rejects.toMatchObject(refused);
    await expect(replica.db.delete(globalSettings)).rejects.toMatchObject(
      refused
    );
    // Pull-only: the replica has nothing that pushes.
    expect(Object.keys(replica).toSorted()).toStrictEqual([
      "close",
      "db",
      "sync",
    ]);
    await expect(callAs(admin, "hijriAdjustment.get")).resolves.toStrictEqual({
      adjustment: 1,
    });
    await expect(
      createGlobalSettingsRepository(replica.db).hijriAdjustment()
    ).resolves.toBe(1);
    await replica.close();
  });

  it("gives devices a read-only token, which Turso refuses a push with", async () => {
    const access = (await callAs(
      new Headers(),
      "contentReplica"
    )) as ReplicaAccess;

    expect(claimsOf(access.token)).toMatchObject({ access: "read-only" });
  });

  it("refuses a Hijri Adjustment beyond two days", async () => {
    const admin = await signInAsAdmin();

    await expect(
      callAs(admin, "hijriAdjustment.set", { adjustment: 3 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

/** How many server rows of each table belong to a Believer. */
const rowCountsOf = async (userId: string) => {
  const rows = {
    user: await db.query.user.findMany({ where: { id: userId } }),
    session: await db.query.session.findMany({ where: { userId } }),
    account: await db.query.account.findMany({ where: { userId } }),
    believerDatabase: await db.query.believerDatabase.findMany({
      where: { userId },
    }),
  };
  return Object.fromEntries(
    Object.entries(rows).map(([table, found]) => [table, found.length])
  );
};

const NO_ROWS = { user: 0, session: 0, account: 0, believerDatabase: 0 };
const ONE_ROW_EACH = { user: 1, session: 1, account: 1, believerDatabase: 1 };

/** The name of the Believer's cloud database, created if need be. */
const databaseOf = async (headers: Headers): Promise<string> => {
  const { url } = await ensure(headers);
  return nameIn(url);
};

const userIdOf = async (headers: Headers): Promise<string> => {
  const { user: signedIn } = (await callAs(headers, "account.privateData")) as {
    user: { id: string };
  };
  return signedIn.id;
};

const tablesIn = (name: string) =>
  syncServer.query(
    name,
    "SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name"
  );

/** What a device would have pushed: settings in the Believer's database. */
const recordInCloud = async (name: string) => {
  await syncServer.query(
    name,
    "CREATE TABLE believer_settings (id TEXT PRIMARY KEY, location_name TEXT)"
  );
  await syncServer.query(
    name,
    "INSERT INTO believer_settings VALUES ('believer', 'Najaf')"
  );
};

describe("account deletion on the local sync server", () => {
  beforeAll(startLocalCloud);
  beforeEach(() => setUp());

  afterAll(stopLocalCloud);

  it("removes the Believer's cloud database and auth rows, and no one else's", async () => {
    const zainab = await signIn("google", idToken(googleBeliever));
    const hasan = await signIn("google", idToken(otherBeliever));
    const zainabId = await userIdOf(zainab);
    const hasanId = await userIdOf(hasan);
    const zainabDatabase = await databaseOf(zainab);
    const hasanDatabase = await databaseOf(hasan);
    await recordInCloud(zainabDatabase);
    await recordInCloud(hasanDatabase);

    await expect(
      callAs(zainab, "account.deleteAccount")
    ).resolves.toStrictEqual({ deleted: true });

    await expect(tablesIn(zainabDatabase)).resolves.toStrictEqual([]);
    await expect(rowCountsOf(zainabId)).resolves.toStrictEqual(NO_ROWS);
    await expect(tablesIn(hasanDatabase)).resolves.toStrictEqual([
      ["believer_settings"],
    ]);
    await expect(rowCountsOf(hasanId)).resolves.toStrictEqual(ONE_ROW_EACH);
  });

  it("ends the session it was called with", async () => {
    const headers = await signIn("google", idToken(googleBeliever));

    await callAs(headers, "account.deleteAccount");

    await expect(callAs(headers, "account.privateData")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("starts a new, empty account and database when the Believer signs in again", async () => {
    const before = await signIn("google", idToken(googleBeliever));
    const beforeId = await userIdOf(before);
    const oldDatabase = await databaseOf(before);
    await recordInCloud(oldDatabase);
    await callAs(before, "account.deleteAccount");

    const again = await signIn("google", idToken(googleBeliever));
    const newDatabase = await databaseOf(again);

    await expect(userIdOf(again)).resolves.not.toBe(beforeId);
    expect(newDatabase).not.toBe(oldDatabase);
    await expect(tablesIn(newDatabase)).resolves.toStrictEqual([]);
  });

  it("keeps the account when the cloud database cannot be destroyed", async () => {
    const host = createLocalSyncHost({ baseUrl: syncServer.baseUrl });
    await setUp({
      ...host,
      destroy: () => Promise.reject(new Error("Turso is down")),
    });
    const headers = await signIn("google", idToken(googleBeliever));
    const userId = await userIdOf(headers);
    await ensure(headers);

    await expect(callAs(headers, "account.deleteAccount")).rejects.toThrow(
      "Turso is down"
    );

    await expect(rowCountsOf(userId)).resolves.toStrictEqual(ONE_ROW_EACH);
    await expect(callAs(headers, "account.privateData")).resolves.toBeDefined();
  });
});

/** The user id stored with each analytics event, in the order received. */
const linkedUsers = async () => {
  const rows = await db.select().from(analyticsEvent);
  return rows.map(({ userId }) => userId);
};

describe("usage analytics through the router", () => {
  beforeAll(startLocalCloud);
  beforeEach(() => setUp());

  afterAll(stopLocalCloud);

  it("stores a Guest's events without a user id and a Believer's with theirs", async () => {
    await callAs(new Headers(), "analytics.track", analyticsBatch());
    const zainab = await signIn("google", idToken(googleBeliever));
    const zainabId = await userIdOf(zainab);
    const otherInstall = analyticsBatch("5c1f2e3d-4b5a-4968-8778-695a4b3c2d1e");
    await callAs(zainab, "analytics.track", {
      ...otherInstall,
      events: otherInstall.events.map((event, index) => ({
        ...event,
        id: `aaaaaaaa-aaaa-4aaa-8aaa-00000000000${index}`,
      })),
    });

    await expect(linkedUsers()).resolves.toStrictEqual([
      null,
      null,
      zainabId,
      zainabId,
    ]);
    await expect(
      callAs(await signInAsAdmin(), "analytics.guestShare", { days: 1 })
    ).resolves.toMatchObject({
      installs: { guest: 1, believer: 1, guestPercentage: 50 },
    });
  });

  it("refuses a malformed batch", async () => {
    await expect(
      callAs(new Headers(), "analytics.track", {
        ...analyticsBatch(),
        installId: "not-a-uuid",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("keeps a deleted Believer's events, unlinked", async () => {
    const zainab = await signIn("google", idToken(googleBeliever));
    await callAs(zainab, "analytics.track", analyticsBatch());

    await callAs(zainab, "account.deleteAccount");

    await expect(linkedUsers()).resolves.toStrictEqual([null, null]);
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
    if (request.method === "DELETE") {
      databases.delete(name);
      send(200, { database: name });
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

  it("gives devices one read-only token for the content database, minted once while it lasts", async () => {
    const guest = await callAs(new Headers(), "contentReplica");
    const believer = await callAs(
      await signIn("google", idToken(googleBeliever)),
      "contentReplica"
    );

    const [contentName, hostname] = [...platform.databases].at(0) ?? [];
    expect(guest).toMatchObject({
      url: `https://${hostname}`,
      token: `jwt-for-${contentName}`,
    });
    expect(believer).toStrictEqual(guest);
    expect(platform.tokenRequests).toStrictEqual([
      {
        database: contentName,
        query: "?expiration=60m&authorization=read-only",
      },
    ]);
  });

  it("destroys the Believer's database on Turso when they delete their account", async () => {
    const headers = await signIn("google", idToken(googleBeliever));
    await callAs(headers, "account.ensureUserDatabase");

    await callAs(headers, "account.deleteAccount");

    expect(platform.databases.size).toBe(0);
  });

  it("deletes an account whose database is already gone", async () => {
    const headers = await signIn("google", idToken(googleBeliever));
    const userId = await userIdOf(headers);

    await expect(
      callAs(headers, "account.deleteAccount")
    ).resolves.toStrictEqual({ deleted: true });
    await expect(rowCountsOf(userId)).resolves.toStrictEqual(NO_ROWS);
  });
});
