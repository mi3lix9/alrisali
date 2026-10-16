import type {
  ContentStatement,
  ContentWriter,
  SqlValue,
} from "@alrisali/db-content/shared";

/**
 * A database over Turso's HTTP API (`/v2/pipeline`, the Hrana protocol),
 * which both Turso Cloud and the local `tursodb --sync-server` speak. The
 * libsql client cannot be used: the local server rejects the `close`
 * request it sends.
 */

interface HranaValue {
  type: "null" | "integer" | "float" | "text" | "blob";
  value?: string | number;
  base64?: string;
}

interface HranaResult {
  rows: HranaValue[][];
}

interface HranaError {
  message: string;
}

type PipelineResult =
  | {
      type: "ok";
      response:
        | { type: "execute"; result: HranaResult }
        | {
            type: "batch";
            result: { step_errors: (HranaError | null)[] };
          };
    }
  | { type: "error"; error: HranaError };

const toHrana = (value: SqlValue): HranaValue => {
  if (value === null) {
    return { type: "null" };
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { type: "integer", value: String(value) }
      : { type: "float", value };
  }
  if (typeof value === "string") {
    return { type: "text", value };
  }
  return { type: "blob", base64: Buffer.from(value).toString("base64") };
};

const fromHrana = (cell: HranaValue): unknown => {
  switch (cell.type) {
    case "null": {
      return null;
    }
    case "integer":
    case "float": {
      return Number(cell.value);
    }
    case "blob": {
      return Buffer.from(cell.base64 ?? "", "base64");
    }
    default: {
      return cell.value;
    }
  }
};

const statement = ({ sql, params }: ContentStatement) => ({
  sql,
  args: params.map(toHrana),
});

export interface HranaPipelineOptions {
  /** The database's URL, e.g. https://content-org.turso.io. */
  url: string;
  /** A token with write access, per request. */
  authToken: () => Promise<string>;
}

/** Writes and reads the content database over HTTP (the server's side). */
export const createHranaPipeline = ({
  url,
  authToken,
}: HranaPipelineOptions): ContentWriter => {
  const endpoint = `${url.replace(/\/+$/u, "")}/v2/pipeline`;

  const send = async (request: unknown): Promise<PipelineResult> => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${await authToken()}`,
      },
      body: JSON.stringify({ requests: [request] }),
    });
    if (!response.ok) {
      throw new Error(
        `Content database refused the request: ${response.status} ${await response.text()}`
      );
    }
    const { results } = (await response.json()) as {
      results: PipelineResult[];
    };
    const [result] = results;
    if (!result) {
      throw new Error("Content database sent no result");
    }
    if (result.type === "error") {
      throw new Error(result.error.message);
    }
    return result;
  };

  return {
    execute: async (sql, params) => {
      const result = await send({
        type: "execute",
        stmt: statement({ sql, params }),
      });
      if (result.type !== "ok" || result.response.type !== "execute") {
        throw new Error("Content database sent no rows");
      }
      return result.response.result.rows.map((row) => row.map(fromHrana));
    },
    transaction: async (statements) => {
      const steps = ["BEGIN", ...statements, "COMMIT"].map((step, index) => ({
        stmt: typeof step === "string" ? { sql: step } : statement(step),
        // Each step runs only when the one before it succeeded.
        ...(index > 0 ? { condition: { type: "ok", step: index - 1 } } : {}),
      }));
      const committed = steps.length - 1;
      const result = await send({
        type: "batch",
        batch: {
          steps: [
            ...steps,
            {
              stmt: { sql: "ROLLBACK" },
              condition: {
                type: "not",
                cond: { type: "ok", step: committed },
              },
            },
          ],
        },
      });
      if (result.type !== "ok" || result.response.type !== "batch") {
        throw new Error("Content database sent no batch result");
      }
      const failure = result.response.result.step_errors
        .slice(0, committed + 1)
        .find((error) => error !== null);
      if (failure) {
        throw new Error(failure.message);
      }
    },
  };
};
