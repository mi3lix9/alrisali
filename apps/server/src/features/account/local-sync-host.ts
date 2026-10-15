import { TOKEN_LIFETIME_MS } from "@/shared/lib/user-database-host";
import type { UserDatabaseHost } from "@/shared/lib/user-database-host";

export interface LocalSyncHostOptions {
  /** A running `tursodb --sync-server`, e.g. http://127.0.0.1:8090. */
  baseUrl: string;
}

const base64url = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

interface PipelineResponse {
  results: (
    | {
        type: "ok";
        response: { result: { rows: { value?: string | number }[][] } };
      }
    | { type: "error"; error: { message: string } }
  )[];
}

/**
 * Believers' databases on a local `tursodb --sync-server` (development and
 * tests). That server checks no tokens, so the token here is an unsigned
 * JWT naming the one database it is for, standing in for Turso's.
 */
export const createLocalSyncHost = ({
  baseUrl,
}: LocalSyncHostOptions): UserDatabaseHost => {
  const databasesUrl = `${baseUrl.replace(/\/+$/u, "")}/db`;

  /**
   * Runs statements in order on the server itself. The server creates a
   * database on its first request; an existing one just answers.
   */
  const pipeline = async (
    name: string,
    statements: string[]
  ): Promise<unknown[][][]> => {
    const response = await fetch(`${databasesUrl}/${name}/v2/pipeline`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requests: statements.map((sql) => ({
          type: "execute",
          stmt: { sql },
        })),
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Local sync server refused ${name}: ${response.status} ${await response.text()}`
      );
    }
    const { results } = (await response.json()) as PipelineResponse;
    return results.map((result) => {
      if (result.type !== "ok") {
        throw new Error(
          `Local sync server failed on ${name}: ${result.error.message}`
        );
      }
      return result.response.result.rows.map((row) =>
        row.map((cell) => cell.value)
      );
    });
  };

  return {
    ensure: async (name) => {
      await pipeline(name, ["SELECT 1"]);
      return { url: `${databasesUrl}/${name}` };
    },
    mintToken: (name) => {
      const expiresAt = Date.now() + TOKEN_LIFETIME_MS;
      const token = [
        base64url({ alg: "none", typ: "JWT" }),
        base64url({ db: name, exp: Math.floor(expiresAt / 1000) }),
        "",
      ].join(".");
      return Promise.resolve({ token, expiresAt });
    },
    // The local server cannot delete a database, so destroying one drops
    // every table in it: nothing the Believer recorded is left to pull.
    destroy: async (name) => {
      const [tables = []] = await pipeline(name, [
        "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\'",
      ]);
      if (tables.length > 0) {
        await pipeline(
          name,
          tables.map(([table]) => `DROP TABLE "${String(table)}"`)
        );
      }
    },
  };
};
