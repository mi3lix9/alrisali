import { TOKEN_LIFETIME_MS } from "@/shared/lib/user-database-host";
import type { UserDatabaseHost } from "@/shared/lib/user-database-host";

export interface LocalSyncHostOptions {
  /** A running `tursodb --sync-server`, e.g. http://127.0.0.1:8090. */
  baseUrl: string;
}

const base64url = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

/**
 * Believers' databases on a local `tursodb --sync-server` (development and
 * tests). That server checks no tokens, so the token here is an unsigned
 * JWT naming the one database and the access it is for, standing in for
 * Turso's; it enforces neither.
 */
export const createLocalSyncHost = ({
  baseUrl,
}: LocalSyncHostOptions): UserDatabaseHost => ({
  ensure: async (name) => {
    const url = `${baseUrl.replace(/\/+$/u, "")}/db/${name}`;
    // The server creates a database on its first request; an existing one
    // just answers.
    const response = await fetch(`${url}/v2/pipeline`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requests: [{ type: "execute", stmt: { sql: "SELECT 1" } }],
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Local sync server refused ${name}: ${response.status} ${await response.text()}`
      );
    }
    return { url };
  },
  mintToken: (name, access = "full-access") => {
    const expiresAt = Date.now() + TOKEN_LIFETIME_MS;
    const token = [
      base64url({ alg: "none", typ: "JWT" }),
      base64url({ db: name, access, exp: Math.floor(expiresAt / 1000) }),
      "",
    ].join(".");
    return Promise.resolve({ token, expiresAt });
  },
});
