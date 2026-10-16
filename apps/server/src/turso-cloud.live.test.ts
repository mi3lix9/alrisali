// ADR-0001 against real Turso Cloud: the production server paths (the
// Platform API host, oRPC procedures, the content database) and the Node
// Turso sync binding standing in for the device, as in the local seams.
// Opt-in: runs only when TURSO_ORG, TURSO_API_TOKEN and TURSO_GROUP are set
// (`bun run test:turso-cloud` in apps/server reads them from .env); skipped
// otherwise, CI included. Every database it creates is destroyed again.
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { createAuth, grantAdminRole } from "@alrisali/auth";
import type { Auth } from "@alrisali/auth";
import {
  createGlobalSettingsRepository,
  openContentReplica,
} from "@alrisali/db-content/shared";
import { connectNodeReplica } from "@alrisali/db-content/testing";
import { createDb } from "@alrisali/db-server";
import type { Database } from "@alrisali/db-server";
import { migrateDb } from "@alrisali/db-server/migrate";
import { createFavoritesRepository } from "@alrisali/db-user/favorites";
import { createMoodCheckInRepository } from "@alrisali/db-user/mood";
import {
  createBelieverSettingsRepository,
  openUserDatabase,
} from "@alrisali/db-user/shared";
import type { UserDatabase } from "@alrisali/db-user/shared";
import { connectNode, temporaryDirectory } from "@alrisali/db-user/testing";
import type { TemporaryDirectory } from "@alrisali/db-user/testing";
import { REMEDIES } from "@alrisali/domain/mood";
import { call } from "@orpc/server";
import type { AnyProcedure } from "@orpc/server";
import { createClient } from "@tursodatabase/api";
import type { TursoClientError } from "@tursodatabase/api";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { createTursoHost } from "@/features/account";
import { createContentDatabase } from "@/shared/lib/content-database";
import type { ContentDatabase } from "@/shared/lib/content-database";
import { createS3FileBucket } from "@/shared/lib/file-bucket";
import { createHranaPipeline } from "@/shared/lib/hrana-pipeline";
import type { UserDatabaseHost } from "@/shared/lib/user-database-host";

import { createContext } from "./context";
import { appRouter } from "./router";

const { TURSO_ORG, TURSO_API_TOKEN, TURSO_GROUP } = process.env;
const live = Boolean(TURSO_ORG && TURSO_API_TOKEN && TURSO_GROUP);

const CLOUD_TIMEOUT_MS = 120_000;
/** Long enough for a one-minute token to expire, with clock skew to spare. */
const EXPIRY_TIMEOUT_MS = 240_000;
const SHORT_TOKEN_WAIT_MS = 75_000;
const HTTP_NOT_FOUND = 404;

const NAJAF = { latitude: 32, longitude: 44.33, name: "Najaf" };
const KARBALA = { latitude: 32.62, longitude: 44.02, name: "Karbala" };
const MASHHAD = { latitude: 36.3, longitude: 59.6, name: "Mashhad" };

const PROVIDER_SIGNATURE = "signed-by-provider";
const TEST_ENV = {
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret",
  CORS_ORIGIN: "http://localhost:3001",
  GOOGLE_CLIENT_IDS: "web-client.apps.googleusercontent.com",
  APPLE_BUNDLE_IDS: "com.alrisali.app",
};

/** A Google ID token "signed" by the stand-in provider. */
const idToken = (claims: Record<string, unknown>): string =>
  [
    ...[{ alg: "RS256" }, claims].map((part) =>
      Buffer.from(JSON.stringify(part)).toString("base64url")
    ),
    PROVIDER_SIGNATURE,
  ].join(".");

/** Unique per run, so parallel or aborted runs never share a database. */
const RUN = `${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`;

const believer = (who: string) => ({
  sub: `google-verify-${RUN}-${who}`,
  email: `${who}-${RUN}@verify.alrisali.org`,
  email_verified: true,
  name: who,
});

/** The app's tables, without SQLite's and the sync engine's own. */
const APP_TABLES =
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%turso%' ORDER BY name";

/** The procedure at a dotted router path, e.g. `account.deleteAccount`. */
const procedureAt = (route: string): AnyProcedure => {
  let node: unknown = appRouter;
  for (const key of route.split(".")) {
    node = (node as Record<string, unknown>)[key];
  }
  return node as AnyProcedure;
};

describe.skipIf(!live)("Turso Cloud (ADR-0001)", () => {
  // This body runs (to collect the tests) even when the suite is skipped,
  // and the client refuses an empty token: "unset" stands in. Creating
  // the clients sends no request.
  const credentials = {
    org: TURSO_ORG ?? "unset",
    token: TURSO_API_TOKEN ?? "unset",
  };
  const platform = createClient(credentials);
  const host: UserDatabaseHost = createTursoHost({
    org: credentials.org,
    apiToken: credentials.token,
    group: TURSO_GROUP ?? "unset",
  });
  const contentName = `verify-content-${RUN}`;
  /** Every database this run may have created, destroyed in afterAll. */
  const created = new Set<string>([contentName]);

  let db: Database;
  let auth: Auth;
  let content: ContentDatabase;
  let devices: TemporaryDirectory;
  const opened: { close: () => Promise<void> }[] = [];

  const signIn = async (who: string): Promise<Headers> => {
    const { headers } = await auth.api.signInSocial({
      body: { provider: "google", idToken: { token: idToken(believer(who)) } },
      returnHeaders: true,
    });
    const cookie = headers
      .getSetCookie()
      .map((setCookie) => setCookie.split(";")[0])
      .join("; ");
    return new Headers({ cookie });
  };

  const callAs = async <T>(
    headers: Headers,
    route: string,
    input?: unknown
  ): Promise<T> => {
    const context = await createContext({
      auth,
      db,
      userDatabases: host,
      content,
      apple: { revoke: () => Promise.resolve() },
      signInOptions: { providers: ["google"], emailPassword: false },
      files: createS3FileBucket({
        bucket: "unused",
        endpoint: "http://127.0.0.1:9",
        region: "auto",
        accessKeyId: "unused",
        secretAccessKey: "unused",
        pathStyle: true,
      }),
      push: {
        send: () => Promise.resolve([]),
        receipts: () => Promise.resolve(new Map()),
      },
      headers,
      clientIp: null,
      ipHashKey: TEST_ENV.BETTER_AUTH_SECRET,
    });
    return (await call(procedureAt(route), input, { context })) as T;
  };

  /** The Believer's database name on Cloud, from the server's own record. */
  const databaseNameOf = async (url: string): Promise<string> => {
    const record = await db.query.believerDatabase.findFirst({
      columns: { name: true },
      where: { url },
    });
    if (!record) {
      throw new Error(`No believer_database row for ${url}`);
    }
    created.add(record.name);
    return record.name;
  };

  /** Reads a database on Cloud over Hrana, as the server would. */
  const cloudQuery = async (name: string, url: string, sql: string) => {
    const { token } = await host.mintToken(name);
    return createHranaPipeline({
      url,
      authToken: () => Promise.resolve(token),
    }).execute(sql, []);
  };

  /** The Platform API status for a database: 200 or the error's status. */
  const platformStatus = async (name: string): Promise<number> => {
    try {
      await platform.databases.get(name);
      return 200;
    } catch (error) {
      return (error as Partial<TursoClientError>).status ?? 0;
    }
  };

  /**
   * A device signed in to `headers`' Believer: Guest (no URL) until
   * `access.signedIn`, then the URL and tokens from the server, the token
   * cached until a minute before it expires (as the native app does).
   */
  const openDevice = async (
    device: string,
    headers: Headers,
    access: { signedIn: boolean; tokenRequests?: number }
  ): Promise<UserDatabase> => {
    let url: string | null = null;
    let cached: { token: string; expiresAt: number } | null = null;
    const database = await openUserDatabase({
      path: path.join(devices.path, `${device}.db`),
      remoteUrl: () => (access.signedIn ? url : null),
      authToken: async () => {
        if (cached && cached.expiresAt - 60_000 > Date.now()) {
          return cached.token;
        }
        access.tokenRequests = (access.tokenRequests ?? 0) + 1;
        const fresh = await callAs<{ token: string; expiresAt: number }>(
          headers,
          "account.userDatabaseToken"
        );
        cached = fresh;
        return fresh.token;
      },
      connect: connectNode,
    });
    opened.push(database);
    // Sign-in on the device: ensureUserDatabase gives the URL.
    ({ url } = await callAs<{ url: string }>(
      headers,
      "account.ensureUserDatabase"
    ));
    return database;
  };

  beforeAll(async () => {
    db = createDb({ DATABASE_URL: ":memory:", DATABASE_AUTH_TOKEN: "" });
    await migrateDb(db);
    auth = createAuth(TEST_ENV, db, {
      verifyIdToken: (token) =>
        Promise.resolve(token.endsWith(`.${PROVIDER_SIGNATURE}`)),
    });
    content = createContentDatabase({ host, name: contentName });
  });

  beforeEach(() => {
    devices = temporaryDirectory();
  });

  afterEach(async () => {
    await Promise.all(opened.splice(0).map((database) => database.close()));
    devices.remove();
  });

  afterAll(async () => {
    await Promise.all([...created].map((name) => host.destroy(name)));
    const left = await Promise.all(
      [...created].map(async (name) => [name, await platformStatus(name)])
    );
    const kept = left.filter(([, status]) => status !== HTTP_NOT_FOUND);
    if (kept.length > 0) {
      throw new Error(`Turso Cloud databases left behind: ${String(kept)}`);
    }
  }, CLOUD_TIMEOUT_MS);

  it(
    "1. creates one database per Believer in the group, however often and concurrently asked",
    async () => {
      const headers = await signIn("ensure");

      const [first, concurrent] = await Promise.all([
        callAs<{ url: string }>(headers, "account.ensureUserDatabase"),
        callAs<{ url: string }>(headers, "account.ensureUserDatabase"),
      ]);
      const again = await callAs<{ url: string }>(
        headers,
        "account.ensureUserDatabase"
      );
      const name = await databaseNameOf(first.url);
      // The Platform API's own idempotency: a second create answers 409 and
      // the host returns the existing database.
      const direct = await host.ensure(name);

      expect({ concurrent, again, direct }).toStrictEqual({
        concurrent: first,
        again: first,
        direct: first,
      });
      expect(first.url).toMatch(/^https:\/\/b-[0-9a-f]{24}-/u);
      await expect(platform.databases.get(name)).resolves.toMatchObject({
        group: TURSO_GROUP,
      });
      await expect(
        cloudQuery(name, first.url, "SELECT 1")
      ).resolves.toStrictEqual([[1]]);
    },
    CLOUD_TIMEOUT_MS
  );

  it(
    "2. pushes a migrated Guest database, every table and row, into the fresh empty cloud database on sign-in",
    async () => {
      const headers = await signIn("guest");
      const access = { signedIn: false, tokenRequests: 0 };
      const phone = await openDevice("phone", headers, access);
      const { url } = await callAs<{ url: string }>(
        headers,
        "account.ensureUserDatabase"
      );
      const name = await databaseNameOf(url);
      // Fresh and empty: no app table yet.
      const emptyCloud = await cloudQuery(name, url, APP_TABLES);

      await createBelieverSettingsRepository(phone.db).update({
        calculationMethod: "ibadi",
        location: NAJAF,
      });
      await createFavoritesRepository(phone.db).add({
        kind: "ayah",
        key: "2:255",
      });
      const checkIn = {
        id: randomUUID(),
        mood: "calm" as const,
        remedyId: REMEDIES.find(({ mood }) => mood === "calm")?.id ?? "",
        checkedInAt: new Date(),
      };
      await createMoodCheckInRepository(phone.db).record(checkIn);
      // A Guest: no request, no token.
      expect({
        emptyCloud,
        outcome: await phone.sync(),
        tokenRequests: access.tokenRequests,
      }).toStrictEqual({
        emptyCloud: [],
        outcome: { status: "paused" },
        tokenRequests: 0,
      });

      access.signedIn = true;
      await expect(phone.sync()).resolves.toMatchObject({ status: "synced" });

      const deviceTables = (await phone.db.all(APP_TABLES)) as unknown[][];
      expect(deviceTables.length).toBeGreaterThan(10);
      expect({
        tables: await cloudQuery(name, url, APP_TABLES),
        settings: await cloudQuery(
          name,
          url,
          "SELECT id, calculation_method, location_name FROM believer_settings"
        ),
        version: await cloudQuery(
          name,
          url,
          "SELECT version FROM schema_version"
        ),
        favorites: await cloudQuery(
          name,
          url,
          "SELECT kind, key FROM favorites"
        ),
        moods: await cloudQuery(
          name,
          url,
          "SELECT id, mood FROM mood_check_ins"
        ),
      }).toStrictEqual({
        tables: deviceTables,
        settings: [["believer", "ibadi", "Najaf"]],
        version: [[phone.schemaVersion]],
        favorites: [["ayah", "2:255"]],
        moods: [[checkIn.id, "calm"]],
      });
    },
    CLOUD_TIMEOUT_MS
  );

  it(
    "3. bootstraps a second device and resolves the same row to the last push",
    async () => {
      const headers = await signIn("devices");
      const phone = await openDevice("phone", headers, { signedIn: true });
      const onPhone = createBelieverSettingsRepository(phone.db);
      await onPhone.update({ location: KARBALA });
      await phone.sync();

      // The new device opens like any Guest, migrated, then signs in.
      const tabletAccess = { signedIn: false };
      const tablet = await openDevice("tablet", headers, tabletAccess);
      tabletAccess.signedIn = true;
      const onTablet = createBelieverSettingsRepository(tablet.db);
      expect({
        outcome: await tablet.sync(),
        settings: await onTablet.get(),
      }).toMatchObject({
        outcome: { status: "synced", pulledChanges: true },
        settings: { location: KARBALA },
      });

      await onPhone.update({ location: NAJAF });
      await onTablet.update({ location: MASHHAD });
      await phone.sync();
      await tablet.sync();
      await phone.sync();

      await expect(onPhone.get()).resolves.toMatchObject({
        location: MASHHAD,
      });
      await expect(onTablet.get()).resolves.toMatchObject({
        location: MASHHAD,
      });
      const { url } = await callAs<{ url: string }>(
        headers,
        "account.ensureUserDatabase"
      );
      await expect(
        cloudQuery(
          await databaseNameOf(url),
          url,
          "SELECT location_name FROM believer_settings"
        )
      ).resolves.toStrictEqual([["Mashhad"]]);
    },
    CLOUD_TIMEOUT_MS
  );

  it(
    "4. lets devices pull the Admins' content with a read-only token, and refuses their push and writes",
    async () => {
      const admin = await signIn("admin");
      await grantAdminRole(db, believer("admin").email);
      await callAs(admin, "hijriAdjustment.set", { offset: -1, forced: null });

      const replicaAccess = await callAs<{
        url: string;
        token: string;
        expiresAt: number;
      }>(new Headers(), "contentReplica");
      const replica = await openContentReplica({
        path: path.join(devices.path, "content.db"),
        remoteUrl: () => replicaAccess.url,
        authToken: () => Promise.resolve(replicaAccess.token),
        connect: connectNodeReplica,
      });
      opened.push(replica);
      const settings = createGlobalSettingsRepository(replica.db);
      await replica.sync();
      expect({
        fromContentDatabase: replicaAccess.url.includes(contentName),
        adjustment: await settings.hijriAdjustment(),
      }).toStrictEqual({
        fromContentDatabase: true,
        adjustment: { offset: -1, forced: null },
      });

      await callAs(admin, "hijriAdjustment.set", { offset: 2, forced: null });
      expect({
        outcome: await replica.sync(),
        adjustment: await settings.hijriAdjustment(),
      }).toStrictEqual({
        outcome: { status: "pulled", pulledChanges: true },
        adjustment: { offset: 2, forced: null },
      });

      // A device that tries anyway: a sync connection (with push) on the
      // read-only token. Cloud must refuse the push.
      const rogue = await connectNode({
        path: path.join(devices.path, "rogue.db"),
        url: () => replicaAccess.url,
        authToken: () => Promise.resolve(replicaAccess.token),
        bootstrapIfEmpty: false,
        clientName: "verify-rogue",
      });
      opened.push(rogue);
      await rogue.pull();
      await rogue.execute(
        "UPDATE global_settings SET hijri_adjustment = 9 WHERE id = 'global'",
        []
      );
      await expect(rogue.push()).rejects.toThrow(
        /SQL write operations are forbidden/u
      );
      // And a direct write over Hrana with the same token.
      await expect(
        createHranaPipeline({
          url: replicaAccess.url,
          authToken: () => Promise.resolve(replicaAccess.token),
        }).execute(
          "UPDATE global_settings SET hijri_adjustment = 9 WHERE id = 'global'",
          []
        )
      ).rejects.toThrow(/SQL write operations are forbidden/u);

      await expect(
        callAs<{ offset: number }>(admin, "hijriAdjustment.get")
      ).resolves.toStrictEqual({ offset: 2, forced: null });
    },
    CLOUD_TIMEOUT_MS
  );

  it(
    "5. refuses an expired token and syncs again once the authToken function fetches a new one",
    async () => {
      const headers = await signIn("expiry");
      const { url } = await callAs<{ url: string }>(
        headers,
        "account.ensureUserDatabase"
      );
      const name = await databaseNameOf(url);
      // One-minute tokens from the same Platform API call the host makes,
      // so the expiry is observable in a test.
      let mints = 0;
      let refresh = true;
      let cached: { token: string; expiresAt: number } | null = null;
      const authToken = async (): Promise<string> => {
        if (cached && (!refresh || cached.expiresAt - 5000 > Date.now())) {
          return cached.token;
        }
        mints += 1;
        const expiresAt = Date.now() + 60_000;
        const { jwt } = await platform.databases.createToken(name, {
          expiration: "1m",
          authorization: "full-access",
        });
        cached = { token: jwt, expiresAt };
        return jwt;
      };
      const phone = await openUserDatabase({
        path: path.join(devices.path, "phone.db"),
        remoteUrl: () => url,
        authToken,
        connect: connectNode,
      });
      opened.push(phone);
      const onPhone = createBelieverSettingsRepository(phone.db);
      await onPhone.update({ location: NAJAF });
      await phone.sync();
      expect(mints).toBe(1);

      // A real wait: the expiry is enforced by Turso Cloud's clock, which
      // fake timers cannot move.
      await delay(SHORT_TOKEN_WAIT_MS);
      await onPhone.update({ location: KARBALA });
      // The expired token, sent again: Cloud refuses it.
      refresh = false;
      await expect(phone.sync()).rejects.toThrow(/token expired/u);
      // The function fetches a fresh one, as the device's does.
      refresh = true;
      await expect(phone.sync()).resolves.toMatchObject({ status: "synced" });
      expect(mints).toBe(2);
      await expect(
        cloudQuery(name, url, "SELECT location_name FROM believer_settings")
      ).resolves.toStrictEqual([["Karbala"]]);
    },
    EXPIRY_TIMEOUT_MS
  );

  it(
    "6. destroys the Believer's cloud database on account deletion",
    async () => {
      const headers = await signIn("deleted");
      const phone = await openDevice("phone", headers, { signedIn: true });
      await createBelieverSettingsRepository(phone.db).update({
        location: NAJAF,
      });
      await phone.sync();
      const { url } = await callAs<{ url: string }>(
        headers,
        "account.ensureUserDatabase"
      );
      const name = await databaseNameOf(url);
      await expect(platformStatus(name)).resolves.toBe(200);

      await expect(
        callAs(headers, "account.deleteAccount")
      ).resolves.toStrictEqual({ deleted: true });

      await expect(platformStatus(name)).resolves.toBe(HTTP_NOT_FOUND);
      await expect(phone.sync()).rejects.toThrow(/status=404/u);
    },
    CLOUD_TIMEOUT_MS
  );
});
