import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { createAuth, grantAdminRole, revokeAdminRole } from "@alrisali/auth";
import type { Auth, SignInOptions } from "@alrisali/auth";
import { createAnnouncementsRepository } from "@alrisali/db-content/announcements";
import { createDailyContentRepository } from "@alrisali/db-content/daily-content";
import { createGatheringsRepository } from "@alrisali/db-content/gatherings";
import { createLessonsRepository } from "@alrisali/db-content/lessons";
import { createLibraryAssetsRepository } from "@alrisali/db-content/library-assets";
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
import { analyticsEvent } from "@alrisali/db-server/schema/analytics";
import { pushDevice } from "@alrisali/db-server/schema/announcements";
import { user as userTable } from "@alrisali/db-server/schema/auth";
import { believerDatabase } from "@alrisali/db-server/schema/believer-database";
import { libraryAsset } from "@alrisali/db-server/schema/library-assets";
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
import { eq } from "drizzle-orm";
import { Hono } from "hono";
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
import { runAnnouncementScheduler } from "@/features/announcements";
import { servesLibraryFile } from "@/features/library-assets";
import type { AppleGrant, AppleRevoker } from "@/shared/lib/apple-revoker";
import { createContentDatabase } from "@/shared/lib/content-database";
import type { ContentDatabase } from "@/shared/lib/content-database";
import {
  FAKE_S3_CREDENTIALS,
  startFakeS3,
} from "@/shared/lib/fake-s3.test-helper";
import type { FakeS3 } from "@/shared/lib/fake-s3.test-helper";
import { createS3FileBucket } from "@/shared/lib/file-bucket";
import type { FileBucket } from "@/shared/lib/file-bucket";
import type {
  PushMessage,
  PushReceipt,
  PushTicket,
  PushTransport,
} from "@/shared/lib/push-transport";
import { mountFiles } from "@/shared/lib/uploads";
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

/** An uploaded Slide image's key; `n` tells them apart. */
const slideKey = (n: number) =>
  `slide/00000000-0000-4000-8000-${String(n).padStart(12, "0")}.png`;

/** A Lesson as an Admin fills it in: new, with two new captioned Slides. */
const lessonDraft = (overrides: Record<string, unknown> = {}) => ({
  title: { ar: "التوحيد", en: "Tawheed" },
  description: { ar: "أصول العقيدة", en: "" },
  category: "aqeedah",
  published: true,
  slides: [
    { imageKey: slideKey(1), caption: { ar: "الله واحد", en: "God is One" } },
    { imageKey: slideKey(2), caption: { ar: "", en: "" } },
  ],
  ...overrides,
});

const CONTACT_MESSAGE = {
  name: "Zainab",
  email: "zainab@example.com",
  subject: "Prayer Times",
  message: "Fajr shows a minute late in Karbala.",
};

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

/** An Expo push token for a test device. */
const pushTokenOf = (device: string) => `ExponentPushToken[${device}]`;

const RAMADAN = {
  ar: { title: "رمضان كريم", body: "تقبل الله صيامكم" },
  en: { title: "Ramadan Kareem", body: "May God accept your fasting" },
};

/** What a function preparing a procedure's input gets. */
interface Prepared {
  content: ContentDatabase;
  db: Database;
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

const SOME_UUID = "0b6c3f4e-9d1a-4c8e-8a57-3f2d1e0c9b7a";

/** A Library Asset as an Admin fills it in: a PDF, unpublished. */
const libraryAssetInput = (overrides: Record<string, unknown> = {}) => ({
  title: { ar: "مفاتيح الجنان", en: "Mafatih al-Jinan" },
  author: { ar: "الشيخ عباس القمي", en: "" },
  description: { ar: "", en: "" },
  category: "dua",
  kind: "pdf",
  fileKey: `library-asset/${SOME_UUID}.pdf`,
  fileSize: 2048,
  coverKey: null,
  order: 0,
  published: false,
  ...overrides,
});

/** A Library Asset stored straight on the server: `{ id }`. */
const storedLibraryAsset = async ({
  db,
}: Prepared): Promise<{ id: string }> => {
  const asset = libraryAssetInput();
  await db.insert(libraryAsset).values({
    id: "stored-asset",
    titleAr: asset.title.ar,
    category: asset.category,
    kind: asset.kind,
    fileKey: asset.fileKey,
    fileSize: asset.fileSize,
  });
  return { id: "stored-asset" };
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
  "account.signInOptions": { access: "anonymous" },
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
  "contact.send": { access: "anonymous", input: CONTACT_MESSAGE },
  "contact.inbox": { access: "admin", input: {} },
  "contact.counts": { access: "admin" },
  "contact.setStatus": {
    access: "admin",
    input: { ids: ["unknown"], status: "read" },
  },
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
  "lessons.list": { access: "admin" },
  "lessons.get": { access: "admin", input: { id: "tawheed" } },
  "lessons.save": { access: "admin", input: lessonDraft() },
  "lessons.remove": { access: "admin", input: { id: "tawheed" } },
  "lessons.reorder": { access: "admin", input: { ids: ["tawheed"] } },
  "libraryAssets.list": { access: "admin" },
  "libraryAssets.save": { access: "admin", input: libraryAssetInput() },
  "libraryAssets.setPublished": {
    access: "admin",
    input: async (prepared: Prepared) => ({
      ...(await storedLibraryAsset(prepared)),
      published: true,
    }),
  },
  "libraryAssets.remove": { access: "admin", input: { id: "missing" } },
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
let files: FileBucket;
// Stands in for Apple's revocation; records what it was asked to revoke.
let appleRevocations: {
  grant: AppleGrant;
  authorizationCode: string | undefined;
}[];
let apple: AppleRevoker;
let signInOptions: SignInOptions;

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
  signInOptions = { providers: [], emailPassword: false };
  appleRevocations = [];
  apple = {
    revoke: (grant, authorizationCode) => {
      appleRevocations.push({ grant, authorizationCode });
      return Promise.resolve();
    },
  };
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
    files,
    push,
    apple,
    signInOptions,
    headers,
    clientIp,
    ipHashKey: TEST_ENV.BETTER_AUTH_SECRET,
  });
  const given = input ?? ACCESS[path]?.input;
  return call(
    entry[1],
    typeof given === "function" ? await given({ content, db }) : given,
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

  it("tells clients how they may sign in", async () => {
    signInOptions = { providers: ["google"], emailPassword: true };

    await expect(
      callAs(new Headers(), "account.signInOptions")
    ).resolves.toStrictEqual({ providers: ["google"], emailPassword: true });
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

/** A device's view of the Library Assets it pulled. */
const pulledLibraryAssets = async (directory: TemporaryDirectory) => {
  const { replica } = await openDeviceReplica(directory, () => true);
  await replica.sync();
  const assets = await createLibraryAssetsRepository(replica.db).list();
  await replica.close();
  return assets;
};

/** Uploads a file as an Admin does: `library-asset` unless told otherwise. */
const uploadLibraryFile = async (
  admin: Headers,
  body: Buffer,
  contentType: string,
  purpose = "library-asset"
): Promise<string> => {
  const upload = await requestUpload(admin, {
    purpose,
    contentType,
    size: body.length,
  });
  await putFile(upload, body);
  return upload.key;
};

const PDF = Buffer.from("%PDF-1.4\n%%EOF\n");

const STRUCTURED_TEXT = Buffer.from(
  JSON.stringify({
    sections: [{ title: { ar: "دعاء" }, passages: [{ ar: "اللهم" }] }],
  })
);

describe("Library Assets", () => {
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

  it("publishes an uploaded PDF with its cover to devices", async () => {
    const admin = await signInAsAdmin();
    const fileKey = await uploadLibraryFile(admin, PDF, "application/pdf");
    const coverKey = await uploadLibraryFile(
      admin,
      PNG,
      "image/png",
      "library-cover"
    );
    const saved = await callAs(
      admin,
      "libraryAssets.save",
      libraryAssetInput({
        fileKey,
        fileSize: PDF.length,
        coverKey,
        published: true,
      })
    );

    const { published: _, ...asset } = saved as { published: boolean };
    await expect(pulledLibraryAssets(device)).resolves.toStrictEqual([asset]);
  });

  it("never sends devices an unpublished Library Asset", async () => {
    const admin = await signInAsAdmin();
    const { id } = (await callAs(
      admin,
      "libraryAssets.save",
      libraryAssetInput()
    )) as { id: string };

    await expect(pulledLibraryAssets(device)).resolves.toStrictEqual([]);
    await callAs(admin, "libraryAssets.setPublished", { id, published: true });
    await expect(pulledLibraryAssets(device)).resolves.toMatchObject([{ id }]);
    await callAs(admin, "libraryAssets.setPublished", { id, published: false });
    await expect(pulledLibraryAssets(device)).resolves.toStrictEqual([]);
  });

  it("lists unpublished Library Assets to Admins with previews of their files", async () => {
    const admin = await signInAsAdmin();
    const fileKey = await uploadLibraryFile(admin, PDF, "application/pdf");
    const saved = await callAs(
      admin,
      "libraryAssets.save",
      libraryAssetInput({ fileKey, fileSize: PDF.length })
    );

    const { assets, previews } = (await callAs(
      admin,
      "libraryAssets.list"
    )) as { assets: unknown[]; previews: Record<string, string> };

    expect(assets).toStrictEqual([saved]);
    await expect(
      fetch(previews[fileKey] ?? "").then((response) => response.text())
    ).resolves.toBe(PDF.toString());
  });

  it("edits a published Library Asset on devices and removes it", async () => {
    const admin = await signInAsAdmin();
    const { id } = (await callAs(
      admin,
      "libraryAssets.save",
      libraryAssetInput({ published: true })
    )) as { id: string };

    await callAs(
      admin,
      "libraryAssets.save",
      libraryAssetInput({ id, published: true, order: 3 })
    );
    await expect(pulledLibraryAssets(device)).resolves.toMatchObject([
      { id, order: 3 },
    ]);
    await callAs(admin, "libraryAssets.remove", { id });
    await expect(pulledLibraryAssets(device)).resolves.toStrictEqual([]);
    await expect(callAs(admin, "libraryAssets.list")).resolves.toMatchObject({
      assets: [],
    });
  });

  it("keeps a Library Asset the Admin can remove again when the content database fails", async () => {
    const admin = await signInAsAdmin();
    const { id } = (await callAs(
      admin,
      "libraryAssets.save",
      libraryAssetInput({ published: true })
    )) as { id: string };

    const working = content;
    content = {
      ...working,
      db: () => Promise.reject(new Error("content database unreachable")),
    };
    await expect(
      callAs(admin, "libraryAssets.remove", { id })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    content = working;

    await expect(callAs(admin, "libraryAssets.list")).resolves.toMatchObject({
      assets: [{ id }],
    });
    await callAs(admin, "libraryAssets.remove", { id });
    await expect(pulledLibraryAssets(device)).resolves.toStrictEqual([]);
    await expect(callAs(admin, "libraryAssets.list")).resolves.toMatchObject({
      assets: [],
    });
  });

  it("publishes structured text only when its file is in the structured-text format", async () => {
    const admin = await signInAsAdmin();
    const good = await uploadLibraryFile(
      admin,
      STRUCTURED_TEXT,
      "application/json"
    );
    const bad = await uploadLibraryFile(
      admin,
      Buffer.from(JSON.stringify({ chapters: [] })),
      "application/json"
    );
    const text = (fileKey: string) =>
      libraryAssetInput({
        kind: "text",
        fileKey,
        fileSize: STRUCTURED_TEXT.length,
      });

    await expect(
      callAs(admin, "libraryAssets.save", text(good))
    ).resolves.toMatchObject({ kind: "text", fileKey: good });
    await expect(
      callAs(admin, "libraryAssets.save", text(bad))
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      callAs(
        admin,
        "libraryAssets.save",
        text(`library-asset/${SOME_UUID}.json`)
      )
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses a file of another kind than the Library Asset's", async () => {
    await expect(
      callAs(
        await signInAsAdmin(),
        "libraryAssets.save",
        libraryAssetInput({ kind: "video" })
      )
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("answers NOT_FOUND when publishing a Library Asset that is gone", async () => {
    await expect(
      callAs(await signInAsAdmin(), "libraryAssets.setPublished", {
        id: "gone",
        published: true,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("serves a Library Asset's files only while it is published", async () => {
    const admin = await signInAsAdmin();
    const fileKey = await uploadLibraryFile(admin, PDF, "application/pdf");
    const app = new Hono();
    mountFiles(app, files, { canServe: servesLibraryFile(content) });
    const { id } = (await callAs(
      admin,
      "libraryAssets.save",
      libraryAssetInput({ fileKey, fileSize: PDF.length })
    )) as { id: string };

    const unpublished = await app.request(`/files/${fileKey}`);
    await callAs(admin, "libraryAssets.setPublished", { id, published: true });
    const published = await app.request(`/files/${fileKey}`);

    expect(unpublished.status).toBe(404);
    expect(published.status).toBe(302);
  });

  it("shows devices nothing before their first pull", async () => {
    const { replica } = await openDeviceReplica(device, () => false);

    await expect(
      createLibraryAssetsRepository(replica.db).list()
    ).resolves.toStrictEqual([]);
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

/** A device's view of the Lessons it pulled. */
const pulledLessons = async (directory: TemporaryDirectory) => {
  const { replica } = await openDeviceReplica(directory, () => true);
  await replica.sync();
  const lessons = await createLessonsRepository(replica.db).list();
  await replica.close();
  return lessons;
};

interface SavedLesson {
  id: string;
  published: boolean;
  slides: { id: string; imageKey: string }[];
}

const saveLesson = async (admin: Headers, draft = lessonDraft()) =>
  (await callAs(admin, "lessons.save", draft)) as SavedLesson;

describe("Lessons and Slides", () => {
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

  it("lets an Admin upload a Slide image", async () => {
    const upload = await requestUpload(await signInAsAdmin(), {
      purpose: "slide",
      contentType: "image/png",
      size: PNG.length,
    });

    expect(upload.key).toMatch(/^slide\/[\da-f-]{36}\.png$/u);
    await expect(putFile(upload, PNG)).resolves.toMatchObject({ status: 200 });
    expect(storedFile(upload.key)).toStrictEqual({
      body: PNG,
      contentType: "image/png",
    });
  });

  it("publishes a Lesson and its Slides, in order, to devices", async () => {
    const admin = await signInAsAdmin();
    const upload = await requestUpload(admin, {
      purpose: "slide",
      contentType: "image/png",
      size: PNG.length,
    });
    await putFile(upload, PNG);
    const lesson = await saveLesson(
      admin,
      lessonDraft({
        slides: [
          { imageKey: upload.key, caption: { ar: "الأولى", en: "First" } },
          { imageKey: slideKey(2), caption: { ar: "الثانية", en: "" } },
        ],
      })
    );

    expect(lesson.slides.map(({ imageKey }) => imageKey)).toStrictEqual([
      upload.key,
      slideKey(2),
    ]);
    await expect(pulledLessons(device)).resolves.toStrictEqual([lesson]);
  });

  it("keeps drafts from devices but shows them to Admins", async () => {
    const admin = await signInAsAdmin();
    const published = await saveLesson(admin);
    const draft = await saveLesson(
      admin,
      lessonDraft({ published: false, slides: [] })
    );

    await expect(pulledLessons(device)).resolves.toStrictEqual([published]);
    await expect(callAs(admin, "lessons.list")).resolves.toStrictEqual([
      published,
      draft,
    ]);
  });

  it("keeps a Slide's id when an Admin edits the Lesson, and gives new ones their own", async () => {
    const admin = await signInAsAdmin();
    const lesson = await saveLesson(admin);
    const [first, second] = lesson.slides;

    const edited = await saveLesson(
      admin,
      lessonDraft({
        id: lesson.id,
        slides: [
          { ...second, caption: { ar: "معدلة", en: "" } },
          { imageKey: slideKey(3), caption: { ar: "", en: "" } },
        ],
      })
    );

    expect(edited.slides[0]?.id).toBe(second?.id);
    expect(edited.slides[1]?.id).not.toBe(first?.id);
    await expect(pulledLessons(device)).resolves.toStrictEqual([edited]);
  });

  it("does not let one Lesson take another's Slide", async () => {
    const admin = await signInAsAdmin();
    const tawheed = await saveLesson(admin);
    const [taken] = tawheed.slides;

    const wudu = await saveLesson(
      admin,
      lessonDraft({
        category: "fiqh",
        slides: [{ ...taken, caption: { ar: "", en: "" } }],
      })
    );

    expect(wudu.slides[0]?.id).not.toBe(taken?.id);
    await expect(
      callAs(admin, "lessons.get", { id: tawheed.id })
    ).resolves.toStrictEqual(tawheed);
  });

  it("orders and deletes Lessons", async () => {
    const admin = await signInAsAdmin();
    const tawheed = await saveLesson(admin);
    const wudu = await saveLesson(admin, lessonDraft({ category: "fiqh" }));

    await callAs(admin, "lessons.reorder", { ids: [wudu.id, tawheed.id] });
    await expect(callAs(admin, "lessons.list")).resolves.toStrictEqual([
      wudu,
      tawheed,
    ]);
    await callAs(admin, "lessons.remove", { id: wudu.id });

    await expect(pulledLessons(device)).resolves.toStrictEqual([tawheed]);
    await expect(
      callAs(admin, "lessons.get", { id: wudu.id })
    ).resolves.toBeNull();
  });

  it("takes only images uploaded as Slides", async () => {
    await expect(
      saveLesson(
        await signInAsAdmin(),
        lessonDraft({
          slides: [
            {
              imageKey:
                "speaker-photo/00000000-0000-4000-8000-000000000001.png",
              caption: { ar: "", en: "" },
            },
          ],
        })
      )
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses publishing a Lesson with no Slides", async () => {
    await expect(
      saveLesson(await signInAsAdmin(), lessonDraft({ slides: [] }))
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("shows devices no Lessons before their first pull", async () => {
    const { replica } = await openDeviceReplica(device, () => false);

    await expect(
      createLessonsRepository(replica.db).list()
    ).resolves.toStrictEqual([]);
    await replica.close();
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

  it("revokes Sign in with Apple with the fresh authorization code", async () => {
    const appleToken = idToken({
      sub: "apple-002",
      aud: "com.alrisali.app",
      email: "maryam@privaterelay.appleid.com",
      email_verified: "true",
    });
    const headers = await signIn("apple", appleToken);
    const userId = await userIdOf(headers);

    await callAs(headers, "account.deleteAccount", {
      appleAuthorizationCode: "fresh-code",
    });

    expect(appleRevocations).toStrictEqual([
      {
        grant: { idToken: appleToken, accessToken: null, refreshToken: null },
        authorizationCode: "fresh-code",
      },
    ]);
    await expect(rowCountsOf(userId)).resolves.toStrictEqual(NO_ROWS);
  });

  it("does not ask Apple to revoke anything for a Google account", async () => {
    const headers = await signIn("google", idToken(googleBeliever));

    await callAs(headers, "account.deleteAccount");

    expect(appleRevocations).toStrictEqual([]);
  });

  it("keeps the account when Apple refuses the revocation", async () => {
    const headers = await signIn(
      "apple",
      idToken({ sub: "apple-003", email: "ali@privaterelay.appleid.com" })
    );
    const userId = await userIdOf(headers);
    await ensure(headers);
    apple = {
      revoke: () =>
        Promise.reject(new Error("Apple /auth/revoke answered 400")),
    };

    await expect(
      callAs(headers, "account.deleteAccount", {
        appleAuthorizationCode: "expired-code",
      })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });

    await expect(rowCountsOf(userId)).resolves.toStrictEqual(ONE_ROW_EACH);
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
