import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { createDb } from "@alrisali/db-server";
import { migrateDb } from "@alrisali/db-server/migrate";
import { Hono } from "hono";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createOtaServer, mountOta, readOtaConfig } from "./index";
import type { OtaConfig, OtaServer } from "./index";

const BUCKET = "ota-bundles";
const BUNDLE_ID = "01920000-0000-7000-8000-000000000001";
// The app's update check for iOS 1.0.0 on the "production" channel (the
// channel key is the channel's base64url, as the app's SDK encodes it).
const CATALOG =
  "/hot-updater/release-catalogs/app-version/ios/cHJvZHVjdGlvbg/1.0.0";
// The app's request for the files of an update, from its built-in bundle.
const ARTIFACTS = `/hot-updater/artifacts/v1/${BUNDLE_ID}/from/00000000-0000-0000-0000-000000000000`;

// Stand-in for the Railway bucket: holds the update's manifest, as the
// `hot-updater deploy` upload leaves it.
const bucketRequests: string[] = [];
const bucket = createServer((request, response) => {
  bucketRequests.push(request.url ?? "");
  response.setHeader("content-type", "application/json");
  response.end(
    JSON.stringify({
      bundleId: BUNDLE_ID,
      assets: { "index.ios.bundle": { fileHash: "bundle-hash" } },
    })
  );
});

let config: OtaConfig;
let ota: OtaServer;
let app: Hono;

const get = (path: string, headers: Record<string, string> = {}) =>
  app.request(path, { headers });

const statusOf = async (path: string, headers?: Record<string, string>) => {
  const response = await get(path, headers);
  return response.status;
};

const asAdmin = () => ({ authorization: `Bearer ${config.adminToken}` });
const asApp = () => ({ "x-api-key": config.clientApiKey });

/** What `hot-updater deploy` sends once the bundle is in the bucket. */
const deployRelease = () =>
  app.request("/hot-updater/admin/releases", {
    method: "POST",
    headers: { ...asAdmin(), "content-type": "application/json" },
    body: JSON.stringify({
      deployments: [
        {
          bundle: {
            id: BUNDLE_ID,
            platform: "ios",
            gitCommitHash: null,
            manifestStorageUri: `s3://${BUCKET}/${BUNDLE_ID}/manifest.json`,
            manifestFileHash: "manifest-hash",
            assetBaseStorageUri: `s3://${BUCKET}/${BUNDLE_ID}/files`,
          },
          release: {
            channel: "production",
            enabled: true,
            fingerprintHash: null,
            message: "Fix",
            shouldForceUpdate: false,
            targetAppVersion: "1.0.x",
          },
        },
      ],
    }),
  });

describe("over-the-air updates", () => {
  beforeAll(async () => {
    bucket.listen(0, "127.0.0.1");
    await once(bucket, "listening");
    const { port } = bucket.address() as AddressInfo;
    config = {
      bucket: BUCKET,
      endpoint: `http://127.0.0.1:${port}`,
      region: "auto",
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      adminToken: "test-admin-token",
      // The format Hot Updater requires: 32 random bytes, base64url.
      clientApiKey: "AQgPFh0kKzI5QEdOVVxjanF4f4aNlJuiqbC3vsXM09o",
    };
  });

  beforeEach(async () => {
    const db = createDb({ DATABASE_URL: ":memory:", DATABASE_AUTH_TOKEN: "" });
    await migrateDb(db);
    ota = createOtaServer(config, db);
    app = new Hono();
    mountOta(app, ota, config.adminToken);
  });

  afterAll(() => {
    bucket.close();
  });

  it("answers /version publicly", async () => {
    await expect(statusOf("/hot-updater/version")).resolves.toBe(200);
  });

  it("is not ready until the deploy step has prepared it", async () => {
    await expect(
      statusOf("/hot-updater/admin/bundles", asAdmin())
    ).resolves.toBe(503);
  });

  describe("once prepared", () => {
    beforeEach(async () => {
      await ota.prepare();
    });

    it("keeps preparing idempotent, as every deploy runs it", async () => {
      await expect(ota.prepare()).resolves.toBeUndefined();
    });

    it("refuses update checks without the client API key", async () => {
      await expect(statusOf(CATALOG)).resolves.toBe(401);
      await expect(
        statusOf(CATALOG, { "x-api-key": "wrong-key" })
      ).resolves.toBe(401);
    });

    it("answers update checks with no release as no update", async () => {
      const response = await get(CATALOG, asApp());
      expect(response.status).toBe(404);
      expect(response.headers.get("x-hot-updater-catalog")).toBe("none");
    });

    it("refuses the admin routes without the CLI's bearer token", async () => {
      await expect(statusOf("/hot-updater/admin/bundles")).resolves.toBe(401);
      await expect(
        statusOf("/hot-updater/admin/bundles", asApp())
      ).resolves.toBe(401);
    });

    it("serves the admin routes with the CLI's bearer token", async () => {
      const response = await get("/hot-updater/admin/bundles", asAdmin());
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ data: [] });
    });

    it("lists a release the CLI deploys in the app's update check", async () => {
      const deployed = await deployRelease();
      expect(deployed.status).toBe(201);
      const catalog = await get(CATALOG, asApp());
      await expect(catalog.json()).resolves.toMatchObject({
        releases: [{ bundleId: BUNDLE_ID }],
      });
    });

    it("hands the app presigned bucket URLs for the release's files", async () => {
      await deployRelease();
      const artifacts = await get(ARTIFACTS, asApp());
      const { manifestUrl } = (await artifacts.json()) as {
        manifestUrl: string;
      };
      // Devices download straight from the bucket.
      expect(manifestUrl).toContain(
        `${config.endpoint}/${BUCKET}/${BUNDLE_ID}/manifest.json`
      );
      expect(manifestUrl).toContain("X-Amz-Signature=");
      expect(bucketRequests).toContainEqual(
        expect.stringContaining(`/${BUCKET}/${BUNDLE_ID}/manifest.json`)
      );
    });
  });

  describe("reading the configuration", () => {
    it("is off when no HOT_UPDATER_* variable is set", () => {
      expect(readOtaConfig({})).toBeUndefined();
    });

    it("names every missing variable when only part is set", () => {
      expect(() =>
        readOtaConfig({
          HOT_UPDATER_BUCKET: BUCKET,
          HOT_UPDATER_ADMIN_TOKEN: "token",
        })
      ).toThrow(
        "Missing HOT_UPDATER_BUCKET_ENDPOINT, HOT_UPDATER_BUCKET_REGION, HOT_UPDATER_BUCKET_ACCESS_KEY_ID, HOT_UPDATER_BUCKET_SECRET_ACCESS_KEY, HOT_UPDATER_CLIENT_API_KEY"
      );
    });
  });
});
