import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { ORPCError, os } from "@orpc/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createRpcHandler } from "./handlers";
import { flushMonitoring, initMonitoring } from "./monitoring";

/** A stand-in for Sentry's ingest endpoint that keeps every envelope it receives. */
const fakeSentry = () => {
  const envelopes: string[] = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      envelopes.push(Buffer.concat(chunks).toString("utf-8"));
      response.writeHead(200).end("{}");
    });
  });
  return { envelopes, server };
};

const testRouter = {
  boom: os.handler(() => {
    throw new Error("forced server error");
  }),
  denied: os.handler(() => {
    throw new ORPCError("UNAUTHORIZED");
  }),
};

const call = (procedure: keyof typeof testRouter) =>
  createRpcHandler(testRouter).handle(
    new Request(`http://localhost/rpc/${procedure}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
    { prefix: "/rpc", context: {} }
  );

describe("server error monitoring", () => {
  const sentry = fakeSentry();

  beforeAll(async () => {
    sentry.server.listen(0, "127.0.0.1");
    await once(sentry.server, "listening");
    const { port } = sentry.server.address() as AddressInfo;
    initMonitoring({
      dsn: `http://public@127.0.0.1:${port}/1`,
      environment: "test",
    });
  });

  beforeEach(() => {
    sentry.envelopes.length = 0;
  });

  afterAll(() => {
    sentry.server.close();
  });

  it("reports an unexpected procedure error to Sentry", async () => {
    const result = await call("boom");
    await flushMonitoring();

    expect(result.response?.status).toBe(500);
    expect(sentry.envelopes.join("\n")).toContain("forced server error");
  });

  it("does not report expected client errors", async () => {
    const result = await call("denied");
    await flushMonitoring();

    expect(result.response?.status).toBe(401);
    expect(sentry.envelopes).toHaveLength(0);
  });
});
