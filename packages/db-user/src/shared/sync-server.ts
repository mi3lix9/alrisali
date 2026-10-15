// A local stand-in for Turso Cloud: `tursodb --sync-server` speaks the same
// sync protocol as Cloud, creates each `/db/<name>` on first request, and
// checks no tokens at all. Tests and local development only; never bundled.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

// The CLI ships as one npm package per platform (optionalDependencies).
const CLI_PACKAGES: Record<string, string> = {
  "darwin-arm64": "@tursodatabase/cli-darwin-arm64",
  "darwin-x64": "@tursodatabase/cli-darwin-x64",
  "linux-arm64": "@tursodatabase/cli-linux-arm64-gnu",
  "linux-x64": "@tursodatabase/cli-linux-x64-gnu",
};

/** Path of the `tursodb` binary installed for this machine. */
export const tursodbBinary = (): string => {
  const platform = `${process.platform}-${process.arch}`;
  const packageName = CLI_PACKAGES[platform];
  if (!packageName) {
    throw new Error(`No tursodb CLI package for ${platform}`);
  }
  const require = createRequire(import.meta.url);
  return path.join(
    path.dirname(require.resolve(`${packageName}/package.json`)),
    "tursodb"
  );
};

export interface SyncServer {
  /** e.g. http://127.0.0.1:8090 */
  baseUrl: string;
  /** The sync URL of one database; the server creates it on first request. */
  databaseUrl: (name: string) => string;
  /**
   * Reads a database on the server itself, not through a device copy: what
   * the cloud holds. Integers come back as numbers, text as strings.
   */
  query: (name: string, sql: string) => Promise<unknown[][]>;
  stop: () => Promise<void>;
}

interface PipelineValue {
  type: "null" | "integer" | "float" | "text" | "blob";
  value?: string | number;
  base64?: string;
}

interface PipelineResponse {
  results: (
    | { type: "ok"; response: { result: { rows: PipelineValue[][] } } }
    | { type: "error"; error: { message: string } }
  )[];
}

const fromPipelineValue = (cell: PipelineValue): unknown => {
  switch (cell.type) {
    case "null": {
      return null;
    }
    case "integer":
    case "float": {
      return Number(cell.value);
    }
    case "blob": {
      return cell.base64;
    }
    default: {
      return cell.value;
    }
  }
};

/** Runs one statement through the sync server's `/v2/pipeline` endpoint. */
const queryServer = async (
  databaseUrl: string,
  sql: string
): Promise<unknown[][]> => {
  const response = await fetch(`${databaseUrl}/v2/pipeline`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql } }] }),
  });
  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }
  const body = (await response.json()) as PipelineResponse;
  const [result] = body.results;
  if (result?.type !== "ok") {
    throw new Error(result?.error.message ?? "No result");
  }
  return result.response.result.rows.map((row) => row.map(fromPipelineValue));
};
export interface StartSyncServerOptions {
  /** Where the server keeps each database, as `<dir>/<name>/data`. */
  directory: string;
  /** Defaults to a free port. */
  port?: number;
  host?: string;
}

const freePort = (host: string): Promise<number> => {
  const { promise, resolve, reject } = Promise.withResolvers<number>();
  const server = createServer();
  server.once("error", reject);
  server.listen(0, host, () => {
    const address = server.address();
    server.close(() => {
      if (address && typeof address === "object") {
        resolve(address.port);
      } else {
        reject(new Error("No free port"));
      }
    });
  });
  return promise;
};

const READY_TIMEOUT_MS = 10_000;
const READY_POLL_MS = 50;

const waitUntilListening = async (
  baseUrl: string,
  exited: () => Error | null
): Promise<void> => {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const failure = exited();
    if (failure) {
      throw failure;
    }
    try {
      // oxlint-disable-next-line no-await-in-loop -- polling until it listens
      await fetch(baseUrl);
      return;
    } catch {
      // oxlint-disable-next-line no-await-in-loop -- polling until it listens
      await sleep(READY_POLL_MS);
    }
  }
  throw new Error(`tursodb --sync-server did not start at ${baseUrl}`);
};

/** Starts `tursodb --sync-server` serving every database under `directory`. */
export const startSyncServer = async ({
  directory,
  host = "127.0.0.1",
  port,
}: StartSyncServerOptions): Promise<SyncServer> => {
  mkdirSync(directory, { recursive: true });
  const listenPort = port ?? (await freePort(host));
  const baseUrl = `http://${host}:${listenPort}`;
  const child = spawn(
    tursodbBinary(),
    ["--sync-server", `${host}:${listenPort}`, "--sync-dir", directory],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  let exitError: Error | null = null;
  const { promise: exited, resolve: onExit } = Promise.withResolvers<null>();
  child.once("exit", (code) => {
    exitError = new Error(
      `tursodb --sync-server exited with ${code}: ${stderr}`
    );
    onExit(null);
  });

  try {
    await waitUntilListening(baseUrl, () => exitError);
  } catch (error) {
    child.kill();
    throw error;
  }

  const databaseUrl = (name: string) => `${baseUrl}/db/${name}`;
  return {
    baseUrl,
    databaseUrl,
    query: (name, sql) => queryServer(databaseUrl(name), sql),
    stop: async () => {
      if (child.exitCode === null) {
        child.kill();
        await exited;
      }
    },
  };
};
