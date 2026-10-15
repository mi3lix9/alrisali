import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { createAuth, grantAdminRole, revokeAdminRole } from "@alrisali/auth";
import type { Auth } from "@alrisali/auth";
import { createDailyContentRepository } from "@alrisali/db-content/daily-content";
import { createGatheringsRepository } from "@alrisali/db-content/gatherings";
import { createProgramsRepository } from "@alrisali/db-content/programs";
import {
  ContentReplicaReadOnlyError,
  createGlobalSettingsRepository,
  createOccasionsRepository,
  globalSettings,
  openContentReplica,
} from "@alrisali/db-content/shared";
import { connectNodeReplica } from "@alrisali/db-content/testing";
import { createDb } from "@alrisali/db-server";
import type { Database } from "@alrisali/db-server";
import { migrateDb } from "@alrisali/db-server/migrate";
import { believerDatabase } from "@alrisali/db-server/schema/believer-database";
import { startSyncServer, temporaryDirectory } from "@alrisali/db-user/testing";
import type { SyncServer, TemporaryDirectory } from "@alrisali/db-user/testing";
import {
  supplicationIdSchema,
  todaysDailyContent,
  WEEKDAYS,
} from "@alrisali/domain/daily-content";
import type { OfficialProgram } from "@alrisali/domain/programs";
import { occasionSchema } from "@alrisali/domain/shared";
import type { OccasionDetails } from "@alrisali/domain/shared";
import { call, isProcedure } from "@orpc/server";
import type { AnyProcedure } from "@orpc/server";
import { Temporal } from "temporal-polyfill";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { z } from "zod";

import { createLocalSyncHost, createTursoHost } from "@/features/account";
import { createContentDatabase } from "@/shared/lib/content-database";
import type { ContentDatabase } from "@/shared/lib/content-database";
import {
  FAKE_S3_CREDENTIALS,
  startFakeS3,
} from "@/shared/lib/fake-s3.test-helper";
import type { FakeS3 } from "@/shared/lib/fake-s3.test-helper";
import { createS3FileBucket } from "@/shared/lib/file-bucket";
import type { FileBucket } from "@/shared/lib/file-bucket";
import type { RecitationSource } from "@/shared/lib/recitation-source";
import type { UserDatabaseHost } from "@/shared/lib/user-database-host";

import { createContext } from "./context";
import { appRouter } from "./router";

type Access = "anonymous" | "believer" | "admin";

/** A valid Occasion as an Admin writes it: Laylat al-Raghaib by default. */
const occasionDetails = (
  change: Partial<OccasionDetails> = {}
): OccasionDetails => ({
  month: 7,
  day: 1,
  type: "celebration",
  name: { ar: "ليلة الرغائب", en: "Laylat al-Raghaib" },
  ...change,
});

const publishedOccasions = z.object({ occasions: z.array(occasionSchema) });

/** A Gathering as an Admin fills it in, without a Speaker. */
const gatheringInput = (overrides: Record<string, unknown> = {}) => ({
  title: { ar: "مجلس عزاء", en: "Majlis" },
  description: { ar: "", en: "" },
  type: "majlis",
  date: "2026-10-20",
  startTime: "19:30",
  endTime: "21:00",
  venue: {
    name: { ar: "حسينية الرسول", en: "" },
    address: "Qatif",
    latitude: 26.56,
    longitude: 50.01,
  },
  speakerId: null,
  livestreamUrl: "https://www.youtube.com/live/abc",
  attendance: "everyone",
  active: true,
  ...overrides,
});

const NO_TEXT = { ar: "", en: "" };

/** A General Official Program with a prayer Act and a dua Act. */
const dailyNawafil: OfficialProgram = {
  id: "daily-nawafil",
  category: "general",
  name: { ar: "النوافل اليومية", en: "Daily nawafil" },
  description: NO_TEXT,
  active: true,
  acts: [
    {
      id: "fajr-nafila",
      name: { ar: "نافلة الفجر", en: "Fajr nafila" },
      description: NO_TEXT,
      schedule: { kind: "daily" },
      salah: { salah: "fajr", timing: "before" },
      detail: {
        type: "prayer",
        preset: "fajr-nafila",
        rakahs: 2,
        steps: NO_TEXT,
        adhkar: NO_TEXT,
        requiresWudu: true,
      },
    },
    {
      id: "friday-dua",
      name: { ar: "دعاء كميل", en: "Dua Kumayl" },
      description: NO_TEXT,
      schedule: { kind: "weekdays", weekdays: [4] },
      salah: { salah: "isha", timing: "after" },
      detail: {
        type: "dua",
        arabic: "اللهم إني أسألك برحمتك التي وسعت كل شيء",
        transliteration: "",
        translation: "O Allah, I ask You by Your mercy",
        instructions: NO_TEXT,
        audioUrl: null,
      },
    },
  ],
};

const CONTACT_MESSAGE = {
  name: "Zainab",
  email: "zainab@example.com",
  subject: "Prayer Times",
  message: "Fajr shows a minute late in Karbala.",
};
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
  "contact.send": { access: "anonymous", input: CONTACT_MESSAGE },
  "contact.inbox": { access: "admin", input: {} },
  "contact.counts": { access: "admin" },
  "contact.setStatus": {
    access: "admin",
    input: { ids: ["unknown"], status: "read" },
  },
  "dailyContent.list": { access: "admin" },
  "dailyContent.set": {
    access: "admin",
    input: { weekday: "friday", supplicationId: "sahifa-weekday-friday" },
  },
  createUpload: {
    access: "admin",
    input: { purpose: "speaker-photo", contentType: "image/png", size: 68 },
  },
  "gatherings.list": { access: "admin" },
  "gatherings.save": { access: "admin", input: gatheringInput() },
  "gatherings.remove": { access: "admin", input: { id: "gathering-1" } },
  "gatherings.speakers.save": {
    access: "admin",
    input: { name: { ar: "الشيخ", en: "" }, photoKey: null },
  },
  "gatherings.speakers.remove": {
    access: "admin",
    input: { id: "speaker-1" },
  },
  "hijriAdjustment.get": { access: "admin" },
  "hijriAdjustment.set": { access: "admin", input: { adjustment: 1 } },
  "occasions.list": { access: "admin" },
  "occasions.create": { access: "admin", input: occasionDetails() },
  "occasions.update": {
    access: "admin",
    input: { id: "missing", ...occasionDetails() },
  },
  "occasions.delete": { access: "admin", input: { id: "missing" } },
  "programs.list": { access: "admin" },
  "programs.get": { access: "admin", input: { id: "daily-nawafil" } },
  "programs.save": { access: "admin", input: dailyNawafil },
  "programs.remove": { access: "admin", input: { id: "daily-nawafil" } },
  "programs.reorder": { access: "admin", input: { ids: ["daily-nawafil"] } },
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
let files: FileBucket;

// An in-process stand-in for the Railway files bucket, started by the tests
// that upload. Presigning needs no bucket, so the rest point nowhere.
let bucket: FakeS3 | undefined;
const FILES_BUCKET = "alrisali-files";
const NO_BUCKET = "http://127.0.0.1:9";

const startBucket = async () => {
  bucket = await startFakeS3();
};

const stopBucket = async () => {
  await bucket?.stop();
  bucket = undefined;
};

const storedFile = (key: string) =>
  bucket?.objects.get(`${FILES_BUCKET}/${key}`);

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
  files = createS3FileBucket({
    bucket: FILES_BUCKET,
    endpoint: bucket?.endpoint ?? NO_BUCKET,
    region: FAKE_S3_CREDENTIALS.region,
    accessKeyId: FAKE_S3_CREDENTIALS.accessKeyId,
    secretAccessKey: FAKE_S3_CREDENTIALS.secretAccessKey,
    pathStyle: true,
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

/** Calls a procedure as a request from `clientIp` with these cookies. */
const callAs = async (
  headers: Headers,
  path: string,
  input?: unknown,
  clientIp: string | null = "203.0.113.7"
) => {
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
    files,
    headers,
    clientIp,
    ipHashKey: TEST_ENV.BETTER_AUTH_SECRET,
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

const feature = (admin: Headers, weekday: string, supplicationId: unknown) =>
  callAs(admin, "dailyContent.set", { weekday, supplicationId });

describe("Daily Content", () => {
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

  it("lists every weekday, empty until Admins choose", async () => {
    const admin = await signInAsAdmin();

    await expect(callAs(admin, "dailyContent.list")).resolves.toStrictEqual({
      days: WEEKDAYS.map((weekday) => ({ weekday, supplicationId: null })),
    });
  });

  it("features the chosen Supplication on its weekday, replacing the last choice", async () => {
    const admin = await signInAsAdmin();

    await feature(admin, "thursday", "sahifa-1");
    const after = (await feature(admin, "thursday", "mafatih-dua-kumayl")) as {
      days: { weekday: string; supplicationId: string | null }[];
    };

    expect(after.days.find((day) => day.weekday === "thursday")).toStrictEqual({
      weekday: "thursday",
      supplicationId: "mafatih-dua-kumayl",
    });
    expect(
      after.days.filter((day) => day.supplicationId !== null)
    ).toHaveLength(1);
  });

  it("clears a weekday", async () => {
    const admin = await signInAsAdmin();
    await feature(admin, "friday", "sahifa-weekday-friday");

    await feature(admin, "friday", null);

    await expect(callAs(admin, "dailyContent.list")).resolves.toStrictEqual({
      days: WEEKDAYS.map((weekday) => ({ weekday, supplicationId: null })),
    });
  });

  it("refuses an id no Book holds, such as the old app's routes", async () => {
    const admin = await signInAsAdmin();

    await Promise.all(
      [
        "sahifa-999",
        "/mafatih/daily-supplications/sunday-supplication",
        "",
      ].map((supplicationId) =>
        expect(feature(admin, "sunday", supplicationId)).rejects.toMatchObject({
          code: "BAD_REQUEST",
        })
      )
    );
    await expect(feature(admin, "someday", "sahifa-1")).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("reaches a device on its next sync and stays there offline", async () => {
    const admin = await signInAsAdmin();
    await feature(admin, "thursday", "mafatih-dua-kumayl");
    let online = false;
    const { replica } = await openDeviceReplica(device, () => online);
    const today = Temporal.PlainDate.from("2026-10-15");

    // Never pulled: nothing to feature yet.
    await expect(
      createDailyContentRepository(replica.db).all()
    ).resolves.toStrictEqual([]);
    online = true;
    await replica.sync();
    await replica.close();
    online = false;
    const { replica: offline } = await openDeviceReplica(device, () => online);

    const entries = await createDailyContentRepository(offline.db).all();
    expect(todaysDailyContent(entries, today)).toMatchObject({
      id: "mafatih-dua-kumayl",
      bookId: "mafatih",
    });
    // Every reference a device pulls resolves to a bundled Supplication.
    for (const { supplicationId } of entries) {
      expect(
        supplicationIdSchema.safeParse(supplicationId).success
      ).toBeTruthy();
    }
    await offline.close();
  });
});

const listOccasions = async (admin: Headers) =>
  publishedOccasions.parse(await callAs(admin, "occasions.list")).occasions;
const createOccasion = async (admin: Headers, details: unknown) =>
  occasionSchema.parse(await callAs(admin, "occasions.create", details));

describe("Occasions managed by Admins", () => {
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

  it("creates Occasions and lists them in calendar order", async () => {
    const admin = await signInAsAdmin();
    const later = await createOccasion(
      admin,
      occasionDetails({ month: 9, day: 19 })
    );
    const created = await createOccasion(admin, {
      ...occasionDetails(),
      name: { ar: "  ليلة الرغائب ", en: "Laylat al-Raghaib" },
    });

    expect(created).toStrictEqual({
      id: expect.any(String),
      ...occasionDetails(),
      name: { ar: "ليلة الرغائب", en: "Laylat al-Raghaib" },
    });
    await expect(listOccasions(admin)).resolves.toStrictEqual([created, later]);
  });

  it("edits and deletes an Occasion", async () => {
    const admin = await signInAsAdmin();
    const kept = await createOccasion(admin, occasionDetails({ month: 12 }));
    const created = await createOccasion(admin, occasionDetails());

    const edited = { ...created, day: 2, type: "religious" };
    await expect(
      callAs(admin, "occasions.update", edited)
    ).resolves.toStrictEqual(edited);
    await expect(listOccasions(admin)).resolves.toStrictEqual([edited, kept]);

    await expect(
      callAs(admin, "occasions.delete", { id: created.id })
    ).resolves.toStrictEqual({ deleted: true });
    await expect(listOccasions(admin)).resolves.toStrictEqual([kept]);
  });

  it("answers an edit or delete of an Occasion that is gone", async () => {
    const admin = await signInAsAdmin();

    await expect(
      callAs(admin, "occasions.update", { id: "gone", ...occasionDetails() })
    ).resolves.toBeNull();
    await expect(
      callAs(admin, "occasions.delete", { id: "gone" })
    ).resolves.toStrictEqual({ deleted: false });
    await expect(listOccasions(admin)).resolves.toStrictEqual([]);
  });

  it.each([
    ["a 13th month", { month: 13 }],
    ["a 31st day", { day: 31 }],
    ["day 0", { day: 0 }],
    ["an unknown type", { type: "lecture" }],
    ["an empty Arabic name", { name: { ar: " ", en: "Laylat al-Raghaib" } }],
    ["no English name", { name: { ar: "ليلة الرغائب" } }],
  ])("refuses an Occasion with %s", async (_, change) => {
    const admin = await signInAsAdmin();
    const created = await createOccasion(admin, occasionDetails());

    await expect(
      callAs(admin, "occasions.create", { ...occasionDetails(), ...change })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      callAs(admin, "occasions.update", { ...created, ...change })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(listOccasions(admin)).resolves.toStrictEqual([created]);
  });

  it("shows a new Occasion on a device after its next sync", async () => {
    const admin = await signInAsAdmin();
    // The device first pulls the content database with no Occasions yet.
    await listOccasions(admin);
    const { replica } = await openDeviceReplica(device, () => true);
    const onDevice = createOccasionsRepository(replica.db);
    await replica.sync();

    const created = await createOccasion(admin, occasionDetails());

    await expect(onDevice.list()).resolves.toStrictEqual([]);
    await expect(replica.sync()).resolves.toStrictEqual({
      status: "pulled",
      pulledChanges: true,
    });
    await expect(onDevice.list()).resolves.toStrictEqual([created]);
    await replica.close();
  });

  it("shows an edited or deleted Occasion on a device after its next sync", async () => {
    const admin = await signInAsAdmin();
    const created = await createOccasion(admin, occasionDetails());
    const { replica } = await openDeviceReplica(device, () => true);
    const onDevice = createOccasionsRepository(replica.db);
    await replica.sync();

    const edited = { ...created, name: { ...created.name, en: "Raghaib" } };
    await callAs(admin, "occasions.update", edited);
    await replica.sync();
    await expect(onDevice.list()).resolves.toStrictEqual([edited]);

    await callAs(admin, "occasions.delete", { id: created.id });
    await replica.sync();
    await expect(onDevice.list()).resolves.toStrictEqual([]);
    await replica.close();
  });

  it("reads no Occasions on a device that has never pulled", async () => {
    await callAs(await signInAsAdmin(), "occasions.create", occasionDetails());
    const { replica } = await openDeviceReplica(device, () => false);

    await expect(
      createOccasionsRepository(replica.db).list()
    ).resolves.toStrictEqual([]);
    await replica.close();
  });
});

interface UploadOutput {
  key: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: number;
}

// The smallest valid PNG: 68 bytes.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

const requestUpload = async (admin: Headers, input?: unknown) =>
  (await callAs(admin, "createUpload", input)) as UploadOutput;

/** What the admin web does with a presigned upload. */
const putFile = (
  upload: UploadOutput,
  body: Buffer,
  headers = upload.headers
) => fetch(upload.url, { method: upload.method, headers, body });

describe("uploads", () => {
  beforeAll(async () => {
    await startLocalCloud();
    await startBucket();
  });
  beforeEach(() => setUp());

  afterAll(async () => {
    await stopBucket();
    await stopLocalCloud();
  });

  it("lets an Admin upload a Speaker photo straight to the bucket", async () => {
    const upload = await requestUpload(await signInAsAdmin());

    expect(upload.key).toMatch(/^speaker-photo\/[\da-f-]{36}\.png$/u);
    expect(upload.expiresAt).toBeGreaterThan(Date.now());
    const response = await putFile(upload, PNG);

    expect(response.status).toBe(200);
    expect(storedFile(upload.key)).toStrictEqual({
      body: PNG,
      contentType: "image/png",
    });
  });

  it("gives every upload its own key", async () => {
    const admin = await signInAsAdmin();
    const first = await requestUpload(admin);
    const second = await requestUpload(admin);

    expect(first.key).not.toBe(second.key);
  });

  it("refuses an anonymous caller and a Believer who is not an Admin", async () => {
    await expect(requestUpload(new Headers())).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    const believer = await signIn("google", idToken(googleBeliever));
    await expect(requestUpload(believer)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it.each([
    ["a type a Speaker photo cannot be", { contentType: "application/pdf" }],
    ["a photo over 5 MiB", { size: 5 * 1024 * 1024 + 1 }],
  ])("refuses %s", async (_, overrides) => {
    await expect(
      requestUpload(await signInAsAdmin(), {
        purpose: "speaker-photo",
        contentType: "image/png",
        size: PNG.length,
        ...overrides,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("binds the presigned URL to the declared type and size", async () => {
    const upload = await requestUpload(await signInAsAdmin());

    const otherType = await putFile(upload, PNG, {
      "content-type": "text/html",
    });
    const otherSize = await putFile(upload, Buffer.concat([PNG, PNG]));

    expect(otherType.status).toBe(403);
    expect(otherSize.status).toBe(403);
    expect(storedFile(upload.key)).toBeUndefined();
  });
});

/** A device's view of the Gatherings it pulled. */
const pulledGatherings = async (directory: TemporaryDirectory) => {
  const { replica } = await openDeviceReplica(directory, () => true);
  await replica.sync();
  const repository = createGatheringsRepository(replica.db);
  const pulled = {
    gatherings: await repository.gatherings(),
    speakers: await repository.speakers(),
  };
  await replica.close();
  return pulled;
};

describe("Gatherings and Speakers", () => {
  let device: TemporaryDirectory;

  beforeAll(async () => {
    await startLocalCloud();
    await startBucket();
  });
  beforeEach(async () => {
    await setUp();
    device = temporaryDirectory();
  });

  afterEach(() => {
    device.remove();
  });

  afterAll(async () => {
    await stopBucket();
    await stopLocalCloud();
  });

  it("publishes a Speaker with an uploaded photo and their Gathering to devices", async () => {
    const admin = await signInAsAdmin();
    const upload = await requestUpload(admin);
    await putFile(upload, PNG);
    const speaker = await callAs(admin, "gatherings.speakers.save", {
      name: { ar: "الشيخ علي", en: "Sheikh Ali" },
      photoKey: upload.key,
    });
    const gathering = await callAs(
      admin,
      "gatherings.save",
      gatheringInput({ speakerId: (speaker as { id: string }).id })
    );

    await expect(pulledGatherings(device)).resolves.toStrictEqual({
      gatherings: [gathering],
      speakers: [speaker],
    });
  });

  it("updates a Gathering in place and removes it", async () => {
    const admin = await signInAsAdmin();
    const { id } = (await callAs(
      admin,
      "gatherings.save",
      gatheringInput()
    )) as {
      id: string;
    };

    await callAs(
      admin,
      "gatherings.save",
      gatheringInput({ id, active: false })
    );
    await expect(callAs(admin, "gatherings.list")).resolves.toMatchObject({
      gatherings: [{ id, active: false }],
    });
    await callAs(admin, "gatherings.remove", { id });
    await expect(callAs(admin, "gatherings.list")).resolves.toStrictEqual({
      gatherings: [],
      speakers: [],
    });
  });

  it("refuses a Gathering whose Speaker does not exist", async () => {
    await expect(
      callAs(
        await signInAsAdmin(),
        "gatherings.save",
        gatheringInput({ speakerId: "nobody" })
      )
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses a Gathering that ends before it starts", async () => {
    await expect(
      callAs(
        await signInAsAdmin(),
        "gatherings.save",
        gatheringInput({ startTime: "20:00", endTime: "19:00" })
      )
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("takes only a photo uploaded as a Speaker photo", async () => {
    await expect(
      callAs(await signInAsAdmin(), "gatherings.speakers.save", {
        name: { ar: "الشيخ", en: "" },
        photoKey: "library-asset/00000000-0000-4000-8000-000000000000.png",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("keeps a Speaker while a Gathering names them", async () => {
    const admin = await signInAsAdmin();
    const { id } = (await callAs(admin, "gatherings.speakers.save", {
      name: { ar: "الشيخ", en: "" },
      photoKey: null,
    })) as { id: string };
    const gathering = (await callAs(
      admin,
      "gatherings.save",
      gatheringInput({ speakerId: id })
    )) as { id: string };

    await expect(
      callAs(admin, "gatherings.speakers.remove", { id })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await callAs(admin, "gatherings.remove", { id: gathering.id });
    await expect(
      callAs(admin, "gatherings.speakers.remove", { id })
    ).resolves.toStrictEqual({ id });
  });

  it("shows devices nothing before their first pull", async () => {
    const { replica } = await openDeviceReplica(device, () => false);
    const repository = createGatheringsRepository(replica.db);

    await expect(repository.gatherings()).resolves.toStrictEqual([]);
    await expect(repository.speakers()).resolves.toStrictEqual([]);
    await replica.close();
  });
});

const ramadan: OfficialProgram = {
  id: "ramadan",
  category: "seasonal",
  name: { ar: "برنامج رمضان", en: "Ramadan" },
  description: { ar: "أعمال شهر رمضان", en: "Acts of the month of Ramadan" },
  active: true,
  window: { start: { month: 9, day: 1 }, end: { month: 9, day: 30 } },
  acts: [
    {
      id: "iftar-dua",
      name: { ar: "دعاء الإفطار", en: "Iftar dua" },
      description: NO_TEXT,
      schedule: { kind: "daily" },
      salah: { salah: "maghrib", timing: "after" },
      detail: { type: "regular" },
    },
  ],
};

describe("Official Programs", () => {
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

  const deviceAfterPull = async () => {
    const { replica } = await openDeviceReplica(device, () => true);
    await replica.sync();
    return { replica, programs: createProgramsRepository(replica.db) };
  };

  it("lists nothing on a device that has never pulled", async () => {
    const { replica } = await openDeviceReplica(device, () => false);

    await expect(
      createProgramsRepository(replica.db).list()
    ).resolves.toStrictEqual([]);
    await replica.close();
  });

  it("publishes Programs and their Acts, in order, to devices", async () => {
    const admin = await signInAsAdmin();
    await callAs(admin, "programs.save", dailyNawafil);
    await callAs(admin, "programs.save", ramadan);

    const { replica, programs } = await deviceAfterPull();

    await expect(programs.list()).resolves.toStrictEqual([
      dailyNawafil,
      ramadan,
    ]);
    await expect(programs.get("ramadan")).resolves.toStrictEqual(ramadan);
    await expect(programs.get("gone")).resolves.toBeNull();
    await replica.close();
  });

  it("replaces a Program's Acts when an Admin edits it", async () => {
    const admin = await signInAsAdmin();
    await callAs(admin, "programs.save", dailyNawafil);
    const { replica, programs } = await deviceAfterPull();

    const [, kumayl] = dailyNawafil.acts;
    const edited: OfficialProgram = {
      ...dailyNawafil,
      name: { ar: "النوافل", en: "Nawafil" },
      acts: kumayl ? [kumayl] : [],
    };
    await callAs(admin, "programs.save", edited);

    await expect(
      callAs(admin, "programs.get", { id: dailyNawafil.id })
    ).resolves.toStrictEqual(edited);
    await replica.sync();
    await expect(programs.list()).resolves.toStrictEqual([edited]);
    await replica.close();
  });

  it("hides an inactive Program from devices but not from Admins", async () => {
    const admin = await signInAsAdmin();
    const paused = { ...ramadan, active: false };
    await callAs(admin, "programs.save", dailyNawafil);
    await callAs(admin, "programs.save", paused);

    const { replica, programs } = await deviceAfterPull();

    await expect(programs.list()).resolves.toStrictEqual([dailyNawafil]);
    await expect(callAs(admin, "programs.list")).resolves.toStrictEqual([
      dailyNawafil,
      paused,
    ]);
    await replica.close();
  });

  it("orders and deletes Programs", async () => {
    const admin = await signInAsAdmin();
    await callAs(admin, "programs.save", dailyNawafil);
    await callAs(admin, "programs.save", ramadan);

    await callAs(admin, "programs.reorder", {
      ids: ["ramadan", "daily-nawafil"],
    });
    await expect(callAs(admin, "programs.list")).resolves.toStrictEqual([
      ramadan,
      dailyNawafil,
    ]);
    // An edit keeps the Program's place.
    await callAs(admin, "programs.save", { ...ramadan, active: false });
    await callAs(admin, "programs.remove", { id: "ramadan" });

    const { replica, programs } = await deviceAfterPull();
    await expect(programs.list()).resolves.toStrictEqual([dailyNawafil]);
    await expect(programs.get("ramadan")).resolves.toBeNull();
    await replica.close();
  });

  it("saves a Program and its Acts all or nothing", async () => {
    const admin = await signInAsAdmin();
    await callAs(admin, "programs.save", dailyNawafil);
    await callAs(admin, "programs.save", ramadan);

    // An Act id already used by another Program fails the insert.
    const [fajr] = dailyNawafil.acts;
    await expect(
      callAs(admin, "programs.save", {
        ...ramadan,
        name: { ar: "x", en: "x" },
        acts: fajr ? [fajr] : [],
      })
    ).rejects.toBeDefined();

    await expect(
      callAs(admin, "programs.get", { id: "ramadan" })
    ).resolves.toStrictEqual(ramadan);
  });

  it("refuses a Seasonal Program without its Hijri window", async () => {
    const admin = await signInAsAdmin();
    const { window: _window, ...withoutWindow } = ramadan;

    await expect(
      callAs(admin, "programs.save", withoutWindow)
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

interface Inbox {
  messages: {
    id: string;
    subject: string;
    status: string;
    fromBeliever: boolean;
  }[];
}

const send = (
  input: Partial<typeof CONTACT_MESSAGE> = {},
  { headers = new Headers(), ip = "203.0.113.7" } = {}
) => callAs(headers, "contact.send", { ...CONTACT_MESSAGE, ...input }, ip);

const inbox = async (admin: Headers, status?: string) =>
  (await callAs(admin, "contact.inbox", status ? { status } : {})) as Inbox;

const setStatus = (admin: Headers, ids: string[], status: string) =>
  callAs(admin, "contact.setStatus", { ids, status });

const HOUR = 60 * 60 * 1000;

describe("contact messages", () => {
  beforeAll(startLocalCloud);
  beforeEach(() => setUp());

  afterEach(() => {
    vi.useRealTimers();
  });

  afterAll(stopLocalCloud);

  it("puts a Guest's message in the Admins' inbox as new", async () => {
    await send();
    const admin = await signInAsAdmin();

    await expect(inbox(admin)).resolves.toMatchObject({
      messages: [
        {
          ...CONTACT_MESSAGE,
          status: "new",
          fromBeliever: false,
          userAgent: null,
        },
      ],
    });
    await expect(callAs(admin, "contact.counts")).resolves.toStrictEqual({
      new: 1,
      read: 0,
      replied: 0,
      archived: 0,
    });
  });

  it("knows a message came from a signed-in Believer", async () => {
    const zainab = await signIn("google", idToken(googleBeliever));
    await send({}, { headers: zainab });

    const { messages } = await inbox(await signInAsAdmin());

    expect(messages.map(({ fromBeliever }) => fromBeliever)).toStrictEqual([
      true,
    ]);
  });

  it("refuses a message outside the limits even without the form", async () => {
    await expect(send({ message: "Too short" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(send({ email: "zainab" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(inbox(await signInAsAdmin())).resolves.toStrictEqual({
      messages: [],
    });
  });

  it("refuses a fourth message from one IP address within the hour", async () => {
    await send({ subject: "First" });
    await send({ subject: "Second" });
    await send({ subject: "Third" });

    await expect(send({ subject: "Fourth" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    const { messages } = await inbox(await signInAsAdmin());
    expect(messages.map(({ subject }) => subject)).toStrictEqual([
      "Third",
      "Second",
      "First",
    ]);
  });

  it("limits each IP address on its own, signed in or not", async () => {
    const zainab = await signIn("google", idToken(googleBeliever));
    await send({}, { headers: zainab });
    await send();
    await send();

    await expect(send({}, { headers: zainab })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    await expect(send({}, { ip: "198.51.100.4" })).resolves.toBeDefined();
  });

  it("accepts messages again once the hour has passed", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() });
    await send();
    vi.setSystemTime(Date.now() + 20 * 60 * 1000);
    await send();
    await send();
    await expect(send()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    // The first message leaves the window; the other two are still in it.
    vi.setSystemTime(Date.now() - 20 * 60 * 1000 + HOUR + 1000);
    await expect(send()).resolves.toBeDefined();
    await expect(send()).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  it("moves messages through read, replied and archived", async () => {
    await send({ subject: "First" });
    await send({ subject: "Second" });
    await send({ subject: "Third" });
    const admin = await signInAsAdmin();
    const { messages } = await inbox(admin);
    const [third, second, first] = messages.map(({ id }) => id);

    await expect(
      setStatus(admin, [first ?? "", second ?? ""], "read")
    ).resolves.toStrictEqual({ updated: 2 });
    await setStatus(admin, [second ?? ""], "replied");
    await setStatus(admin, [third ?? ""], "archived");

    await expect(callAs(admin, "contact.counts")).resolves.toStrictEqual({
      new: 0,
      read: 1,
      replied: 1,
      archived: 1,
    });
    const subjectsWith = async (status: string) => {
      const filtered = await inbox(admin, status);
      return filtered.messages.map(({ subject }) => subject);
    };
    await expect(
      Promise.all(["new", "read", "replied", "archived"].map(subjectsWith))
    ).resolves.toStrictEqual([[], ["First"], ["Second"], ["Third"]]);
  });

  it("changes nothing for an id it does not know", async () => {
    await send();
    const admin = await signInAsAdmin();

    await expect(setStatus(admin, ["unknown"], "read")).resolves.toStrictEqual({
      updated: 0,
    });
    await expect(callAs(admin, "contact.counts")).resolves.toMatchObject({
      new: 1,
    });
  });

  it("deletes a Believer's messages with their account", async () => {
    const zainab = await signIn("google", idToken(googleBeliever));
    await send({ subject: "From Zainab" }, { headers: zainab });
    await send({ subject: "From a Guest" });

    await callAs(zainab, "account.deleteAccount");

    const { messages } = await inbox(await signInAsAdmin());
    expect(messages.map(({ subject }) => subject)).toStrictEqual([
      "From a Guest",
    ]);
  });
});
