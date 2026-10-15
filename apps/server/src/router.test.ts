import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { createAuth, grantAdminRole, revokeAdminRole } from "@alrisali/auth";
import type { Auth } from "@alrisali/auth";
import { createAnnouncementsRepository } from "@alrisali/db-content/announcements";
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
import { pushDevice } from "@alrisali/db-server/schema/announcements";
import { user as userTable } from "@alrisali/db-server/schema/auth";
import { believerDatabase } from "@alrisali/db-server/schema/believer-database";
import { startSyncServer, temporaryDirectory } from "@alrisali/db-user/testing";
import type { SyncServer, TemporaryDirectory } from "@alrisali/db-user/testing";
import { call, isProcedure } from "@orpc/server";
import type { AnyProcedure } from "@orpc/server";
import { eq } from "drizzle-orm";
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
import { runAnnouncementScheduler } from "@/features/announcements";
import { createContentDatabase } from "@/shared/lib/content-database";
import type { ContentDatabase } from "@/shared/lib/content-database";
import type {
  PushMessage,
  PushReceipt,
  PushTicket,
  PushTransport,
} from "@/shared/lib/push-transport";
import type { RecitationSource } from "@/shared/lib/recitation-source";
import type { UserDatabaseHost } from "@/shared/lib/user-database-host";

import { createContext } from "./context";
import { appRouter } from "./router";

type Access = "anonymous" | "believer" | "admin";

/** An Expo push token for a test device. */
const pushTokenOf = (device: string) => `ExponentPushToken[${device}]`;

const RAMADAN = {
  ar: { title: "رمضان كريم", body: "تقبل الله صيامكم" },
  en: { title: "Ramadan Kareem", body: "May God accept your fasting" },
};

/** What a function preparing a procedure's input gets. */
interface Prepared {
  content: ContentDatabase;
}

/**
 * An Announcement stored straight in the content database, for procedures
 * that act on one: `{ id }` of a publishable draft, or a scheduled one.
 */
const storedAnnouncement =
  (scheduled = false) =>
  async ({ content }: Prepared): Promise<{ id: string }> => {
    const announcements = createAnnouncementsRepository(await content.db());
    const { id } = await announcements.create(
      { text: RAMADAN, audience: "all" },
      Date.now()
    );
    if (scheduled) {
      await announcements.schedule(id, Date.now() + 60_000, Date.now());
    }
    return { id };
  };

/**
 * Who may call each procedure, and a valid input for it (or a function
 * preparing one). Every procedure in the router is listed here: adding one
 * without its rule fails the suite.
 */
const ACCESS: Record<
  string,
  {
    access: Access;
    input?: unknown | ((prepared: Prepared) => Promise<unknown>);
  }
> = {
  healthCheck: { access: "anonymous" },
  contentReplica: { access: "anonymous" },
  "account.privateData": { access: "believer" },
  "account.ensureUserDatabase": { access: "believer" },
  "account.userDatabaseToken": { access: "believer" },
  "account.deleteAccount": { access: "believer" },
  "announcements.list": { access: "admin" },
  "announcements.get": { access: "admin", input: storedAnnouncement() },
  "announcements.create": {
    access: "admin",
    input: { text: RAMADAN, audience: "all" },
  },
  "announcements.update": {
    access: "admin",
    input: async (prepared: Prepared) => ({
      ...(await storedAnnouncement()(prepared)),
      text: RAMADAN,
      audience: "new",
    }),
  },
  "announcements.schedule": {
    access: "admin",
    input: async (prepared: Prepared) => ({
      ...(await storedAnnouncement()(prepared)),
      at: Date.now() + 60_000,
    }),
  },
  "announcements.unschedule": {
    access: "admin",
    input: storedAnnouncement(true),
  },
  "announcements.publishNow": { access: "admin", input: storedAnnouncement() },
  "announcements.duplicate": { access: "admin", input: storedAnnouncement() },
  "announcements.remove": { access: "admin", input: storedAnnouncement() },
  "announcements.sendTest": { access: "admin", input: storedAnnouncement() },
  "announcements.registerDevice": {
    access: "anonymous",
    input: {
      pushToken: pushTokenOf("guard"),
      platform: "ios",
      language: "ar",
      enabled: true,
    },
  },
  "announcements.inbox": {
    access: "anonymous",
    input: { pushToken: pushTokenOf("guard") },
  },
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

/**
 * Stand-in for Expo Push: records every message, answers
 * DeviceNotRegistered for the tokens in `dead`, and gives the receipts set
 * in `receiptsById`.
 */
interface FakePush extends PushTransport {
  sent: PushMessage[];
  dead: Set<string>;
  receiptsById: Map<string, PushReceipt>;
}

const fakePush = (): FakePush => {
  const sent: PushMessage[] = [];
  const dead = new Set<string>();
  const receiptsById = new Map<string, PushReceipt>();
  return {
    sent,
    dead,
    receiptsById,
    send: (messages) => {
      const tickets = messages.map((message): PushTicket => {
        if (dead.has(message.to)) {
          return {
            status: "error",
            message: `${message.to} is not a registered push notification recipient`,
            error: "DeviceNotRegistered",
          };
        }
        sent.push(message);
        return { status: "ok", id: `ticket-${sent.length}` };
      });
      return Promise.resolve(tickets);
    },
    receipts: (ticketIds) =>
      Promise.resolve(
        new Map(
          ticketIds.flatMap((id) => {
            const receipt = receiptsById.get(id);
            return receipt ? [[id, receipt] as const] : [];
          })
        )
      ),
  };
};

let db: Database;
let auth: Auth;
let userDatabases: UserDatabaseHost;
let content: ContentDatabase;
let push: FakePush;

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
  push = fakePush();
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
    push,
    headers,
  });
  const given = input ?? ACCESS[path]?.input;
  return call(
    entry[1],
    typeof given === "function" ? await given({ content }) : given,
    {
      context,
    }
  );
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

interface StoredAnnouncement {
  id: string;
  status: string;
  sentAt: number | null;
}

const registerDevice = async (
  headers: Headers,
  device: string,
  { language = "ar", enabled = true } = {}
) => {
  await callAs(headers, "announcements.registerDevice", {
    pushToken: pushTokenOf(device),
    platform: "ios",
    language,
    enabled,
  });
};

const inboxOf = async (device: string) =>
  (
    (await callAs(new Headers(), "announcements.inbox", {
      pushToken: pushTokenOf(device),
    })) as { announcements: { title: string; body: string }[] }
  ).announcements;

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

/** Sets when a device last checked in and first registered. */
const ageDevice = async (
  device: string,
  { lastSeenDaysAgo = 0, registeredDaysAgo = 0 }
) => {
  await db
    .update(pushDevice)
    .set({
      lastSeenAt: new Date(Date.now() - lastSeenDaysAgo * DAY),
      createdAt: new Date(Date.now() - registeredDaysAgo * DAY),
    })
    .where(eq(pushDevice.token, pushTokenOf(device)));
};

const createAnnouncement = async (admin: Headers, draft?: unknown) =>
  (await callAs(
    admin,
    "announcements.create",
    draft ?? { text: RAMADAN, audience: "all" }
  )) as StoredAnnouncement;

const scheduleIn = async (admin: Headers, id: string, minutes: number) =>
  (await callAs(admin, "announcements.schedule", {
    id,
    at: Date.now() + minutes * MINUTE,
  })) as StoredAnnouncement;

/** One scheduler pass, `minutes` from now. */
const runSchedulerIn = (minutes: number) =>
  runAnnouncementScheduler(
    { content, db, push },
    Date.now() + minutes * MINUTE
  );

const sentTo = () =>
  push.sent.map(({ to, title }) => [to.slice(18, -1), title]).toSorted();

describe("Announcements via Expo Push", () => {
  beforeAll(startLocalCloud);
  beforeEach(() => setUp());

  afterAll(stopLocalCloud);

  it("sends a scheduled Announcement once it is due, and only once", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(new Headers(), "guest");
    const { id } = await createAnnouncement(admin);
    await scheduleIn(admin, id, 10);

    await runSchedulerIn(5);
    expect(push.sent).toStrictEqual([]);

    await runSchedulerIn(11);
    await runSchedulerIn(12);
    expect(push.sent).toStrictEqual([
      {
        to: pushTokenOf("guest"),
        title: RAMADAN.ar.title,
        body: RAMADAN.ar.body,
        data: { announcementId: id },
      },
    ]);
    await expect(
      callAs(admin, "announcements.get", { id })
    ).resolves.toMatchObject({ status: "sent", sentAt: expect.any(Number) });
  });

  it("sends each device the Announcement in its own language", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(new Headers(), "arabic", { language: "ar" });
    await registerDevice(new Headers(), "english", { language: "en" });
    const { id } = await createAnnouncement(admin);

    await expect(
      callAs(admin, "announcements.publishNow", { id })
    ).resolves.toMatchObject({ announcement: { status: "sent" }, devices: 2 });

    expect(sentTo()).toStrictEqual([
      ["arabic", RAMADAN.ar.title],
      ["english", RAMADAN.en.title],
    ]);
    await expect(inboxOf("english")).resolves.toStrictEqual([
      { id, ...RAMADAN.en, sentAt: expect.any(Number) },
    ]);
    await expect(inboxOf("arabic")).resolves.toMatchObject([RAMADAN.ar]);
  });

  it("follows the language a device checked in with last", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(new Headers(), "phone", { language: "ar" });
    await registerDevice(new Headers(), "phone", { language: "en" });
    const { id } = await createAnnouncement(admin);

    await callAs(admin, "announcements.publishNow", { id });

    expect(sentTo()).toStrictEqual([["phone", RAMADAN.en.title]]);
  });

  it("reaches only active Believers with the Active audience", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(new Headers(), "daily");
    await registerDevice(new Headers(), "lapsed");
    await ageDevice("daily", { lastSeenDaysAgo: 1, registeredDaysAgo: 300 });
    await ageDevice("lapsed", { lastSeenDaysAgo: 40, registeredDaysAgo: 300 });
    const { id } = await createAnnouncement(admin, {
      text: RAMADAN,
      audience: "active",
    });

    await callAs(admin, "announcements.publishNow", { id });

    expect(sentTo()).toStrictEqual([["daily", RAMADAN.ar.title]]);
  });

  it("reaches only new Believers with the New audience, not old ones on a new phone", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(new Headers(), "newcomer");
    await registerDevice(new Headers(), "veteran");
    await ageDevice("veteran", { registeredDaysAgo: 200 });
    const believer = await signIn("google", idToken(googleBeliever));
    await registerDevice(believer, "new-phone");
    await db
      .update(userTable)
      .set({ createdAt: new Date(Date.now() - 400 * DAY) })
      .where(eq(userTable.email, googleBeliever.email));
    const { id } = await createAnnouncement(admin, {
      text: RAMADAN,
      audience: "new",
    });

    await callAs(admin, "announcements.publishNow", { id });

    expect(sentTo()).toStrictEqual([["newcomer", RAMADAN.ar.title]]);
  });

  it("stops sending to a device that turned Announcements off", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(new Headers(), "quiet");
    await registerDevice(new Headers(), "listening");
    const first = await createAnnouncement(admin);
    await callAs(admin, "announcements.publishNow", { id: first.id });

    await registerDevice(new Headers(), "quiet", { enabled: false });
    const second = await createAnnouncement(admin, {
      text: {
        ar: { title: "عيد مبارك", body: "كل عام وأنتم بخير" },
        en: { title: "Eid Mubarak", body: "Blessed Eid" },
      },
      audience: "all",
    });
    await callAs(admin, "announcements.publishNow", { id: second.id });

    expect(sentTo()).toStrictEqual([
      ["listening", "رمضان كريم"],
      ["listening", "عيد مبارك"],
      ["quiet", "رمضان كريم"],
    ]);
    // The inbox keeps what arrived before.
    await expect(inboxOf("quiet")).resolves.toMatchObject([RAMADAN.ar]);
    await expect(inboxOf("listening")).resolves.toMatchObject([
      { title: "عيد مبارك" },
      RAMADAN.ar,
    ]);
  });

  it("prunes a device Expo calls unregistered when sending", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(new Headers(), "uninstalled");
    await registerDevice(new Headers(), "kept");
    push.dead.add(pushTokenOf("uninstalled"));
    const { id } = await createAnnouncement(admin);

    await expect(
      callAs(admin, "announcements.publishNow", { id })
    ).resolves.toMatchObject({ devices: 1 });

    const tokens = await db
      .select({ token: pushDevice.token })
      .from(pushDevice);
    expect(tokens).toStrictEqual([{ token: pushTokenOf("kept") }]);
  });

  it("prunes a device whose receipt says it is unregistered", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(new Headers(), "uninstalled");
    await registerDevice(new Headers(), "kept");
    const { id } = await createAnnouncement(admin);
    await scheduleIn(admin, id, 1);
    await runSchedulerIn(2);
    const deadTicket = `ticket-${
      push.sent.findIndex(({ to }) => to === pushTokenOf("uninstalled")) + 1
    }`;
    push.receiptsById.set(deadTicket, {
      status: "error",
      message: "The device is not registered",
      error: "DeviceNotRegistered",
    });

    // Receipts are read a quarter of an hour after sending.
    await runSchedulerIn(5);
    await expect(db.select().from(pushDevice)).resolves.toHaveLength(2);
    await runSchedulerIn(20);

    const tokens = await db
      .select({ token: pushDevice.token })
      .from(pushDevice);
    expect(tokens).toStrictEqual([{ token: pushTokenOf("kept") }]);
    await expect(inboxOf("uninstalled")).resolves.toStrictEqual([]);
  });

  it("sends a test only to the Admin's own devices and records nothing", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(admin, "admin-phone", { language: "en" });
    await registerDevice(new Headers(), "guest");
    const { id } = await createAnnouncement(admin);

    await expect(
      callAs(admin, "announcements.sendTest", { id })
    ).resolves.toStrictEqual({ devices: 1 });

    expect(sentTo()).toStrictEqual([["admin-phone", RAMADAN.en.title]]);
    await expect(inboxOf("admin-phone")).resolves.toStrictEqual([]);
    await expect(
      callAs(admin, "announcements.get", { id })
    ).resolves.toMatchObject({ status: "draft" });
  });

  it("keeps drafts, edits, duplicates and deletes them", async () => {
    const admin = await signInAsAdmin();
    const draft = await createAnnouncement(admin, {
      text: { ar: { title: "مسودة", body: "" }, en: { title: "", body: "" } },
      audience: "all",
    });
    expect(draft).toMatchObject({ status: "draft", scheduledAt: null });

    const edited = await callAs(admin, "announcements.update", {
      id: draft.id,
      text: RAMADAN,
      audience: "active",
    });
    expect(edited).toMatchObject({ text: RAMADAN, audience: "active" });

    const copy = (await callAs(admin, "announcements.duplicate", {
      id: draft.id,
    })) as StoredAnnouncement;
    expect(copy).toMatchObject({
      status: "draft",
      text: RAMADAN,
      audience: "active",
    });
    expect(copy.id).not.toBe(draft.id);

    await callAs(admin, "announcements.remove", { id: draft.id });
    const { announcements } = (await callAs(admin, "announcements.list")) as {
      announcements: StoredAnnouncement[];
    };
    expect(announcements.map(({ id }) => id)).toStrictEqual([copy.id]);
  });

  it("refuses to schedule or publish until both languages are written", async () => {
    const admin = await signInAsAdmin();
    const { id } = await createAnnouncement(admin, {
      text: { ar: RAMADAN.ar, en: { title: "Ramadan", body: "" } },
      audience: "all",
    });

    await expect(scheduleIn(admin, id, 5)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      callAs(admin, "announcements.publishNow", { id })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("returns a scheduled Announcement to a draft, which the scheduler leaves alone", async () => {
    const admin = await signInAsAdmin();
    await registerDevice(new Headers(), "guest");
    const { id } = await createAnnouncement(admin);
    await scheduleIn(admin, id, 1);

    await expect(
      callAs(admin, "announcements.unschedule", { id })
    ).resolves.toMatchObject({ status: "draft", scheduledAt: null });
    await runSchedulerIn(5);

    expect(push.sent).toStrictEqual([]);
  });

  it("freezes an Announcement once sent, but lets it be duplicated", async () => {
    const admin = await signInAsAdmin();
    const { id } = await createAnnouncement(admin);
    await callAs(admin, "announcements.publishNow", { id });

    const conflict = { code: "CONFLICT" };
    await expect(
      callAs(admin, "announcements.update", {
        id,
        text: RAMADAN,
        audience: "new",
      })
    ).rejects.toMatchObject(conflict);
    await expect(scheduleIn(admin, id, 5)).rejects.toMatchObject(conflict);
    await expect(
      callAs(admin, "announcements.publishNow", { id })
    ).rejects.toMatchObject(conflict);
    await expect(
      callAs(admin, "announcements.remove", { id })
    ).rejects.toMatchObject(conflict);
    await expect(
      callAs(admin, "announcements.duplicate", { id })
    ).resolves.toMatchObject({ status: "draft", text: RAMADAN });
  });

  it("answers NOT_FOUND for an unknown Announcement", async () => {
    const admin = await signInAsAdmin();

    await expect(
      callAs(admin, "announcements.get", { id: "missing" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      callAs(admin, "announcements.remove", { id: "missing" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("ties a device to the Believer signed in on it, and keeps it as a Guest's after account deletion", async () => {
    const believer = await signIn("google", idToken(googleBeliever));
    await registerDevice(believer, "phone");
    const userId = await userIdOf(believer);

    await expect(
      db.select({ userId: pushDevice.userId }).from(pushDevice)
    ).resolves.toStrictEqual([{ userId }]);
    await callAs(believer, "account.deleteAccount");
    await expect(
      db.select({ userId: pushDevice.userId }).from(pushDevice)
    ).resolves.toStrictEqual([{ userId: null }]);
  });
});
