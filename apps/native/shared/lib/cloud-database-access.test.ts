import { describe, expect, it, vi } from "vitest";

import { createCloudDatabaseAccess } from "./cloud-database-access";
import type { CloudDatabaseServer } from "./cloud-database-access";

const HOUR_MS = 3_600_000;

const fakeServer = () => ({
  getCookie: vi.fn<CloudDatabaseServer["getCookie"]>(() =>
    Promise.resolve("session=old")
  ),
  ensureUserDatabase: vi.fn<CloudDatabaseServer["ensureUserDatabase"]>(() =>
    Promise.resolve({ url: "libsql://mine" })
  ),
  userDatabaseToken: vi.fn<CloudDatabaseServer["userDatabaseToken"]>(() =>
    Promise.resolve({ token: "new", expiresAt: Date.now() + HOUR_MS })
  ),
});

describe("cloud database access across sign-out", () => {
  it("drops a token fetched for the last Believer after sign-out", async () => {
    const server = fakeServer();
    const oldToken = Promise.withResolvers<{
      token: string;
      expiresAt: number;
    }>();
    server.userDatabaseToken.mockReturnValueOnce(oldToken.promise);
    const access = createCloudDatabaseAccess(server);
    const pending = access.token();

    access.disconnect();
    oldToken.resolve({ token: "old", expiresAt: Date.now() + HOUR_MS });

    await expect(pending).rejects.toThrow("The Believer changed");
    await expect(access.token()).resolves.toBe("new");
  });

  it("does not reconnect when the database is ensured after sign-out", async () => {
    const server = fakeServer();
    const ensured = Promise.withResolvers<{ url: string }>();
    server.ensureUserDatabase.mockReturnValueOnce(ensured.promise);
    const access = createCloudDatabaseAccess(server);
    const connecting = access.connect();
    await vi.waitFor(() => {
      expect(server.ensureUserDatabase).toHaveBeenCalledOnce();
    });

    access.disconnect();
    ensured.resolve({ url: "libsql://old" });

    await expect(connecting).resolves.toBeFalsy();
    expect(access.url()).toBeNull();
  });

  it("does not reconnect when the session check settles after sign-out", async () => {
    const server = fakeServer();
    const cookie = Promise.withResolvers<string>();
    server.getCookie.mockReturnValueOnce(cookie.promise);
    const access = createCloudDatabaseAccess(server);
    const connecting = access.connect();

    access.disconnect();
    cookie.resolve("session=old");

    await expect(connecting).resolves.toBeFalsy();
    expect(server.ensureUserDatabase).not.toHaveBeenCalled();
    expect(access.url()).toBeNull();
  });

  it("connects a signed-in Believer", async () => {
    const access = createCloudDatabaseAccess(fakeServer());

    await expect(access.connect()).resolves.toBeTruthy();
    expect(access.url()).toBe("libsql://mine");
  });
});
