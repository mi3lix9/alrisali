// Test support: an in-process stand-in for the Railway bucket (S3, path
// style). It checks presigned URLs the way S3 does (Signature Version 4 in the
// query string, expiry, signed headers), stores PUT bodies and serves GETs.
// Never bundled.
import { createHash, createHmac } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

/** The credentials the fake accepts; a client signs with these. */
export const FAKE_S3_CREDENTIALS = {
  accessKeyId: "FAKEACCESSKEYID0000000000",
  secretAccessKey: "fake-secret-access-key-fake-secret-access-key",
  region: "auto",
} as const;

export interface FakeS3 {
  endpoint: string;
  /** Stored objects by `<bucket>/<key>`. */
  objects: Map<string, { body: Buffer; contentType: string | undefined }>;
  /** The last bucket CORS configuration PUT, as XML. */
  cors: () => string | undefined;
  stop: () => Promise<void>;
}

const hmac = (key: Buffer | string, data: string): Buffer =>
  createHmac("sha256", key).update(data).digest();

// RFC 3986, as SigV4 wants query parameters encoded.
const encode = (value: string): string =>
  encodeURIComponent(value).replaceAll(
    /[!'()*]/gu,
    (char) => `%${char.codePointAt(0)?.toString(16).toUpperCase()}`
  );

const AMZ_DATE =
  /^(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})T(?<hour>\d{2})(?<minute>\d{2})(?<second>\d{2})Z$/u;

const parseAmzDate = (value: string): number => {
  const match = AMZ_DATE.exec(value)?.groups;
  if (!match) {
    return Number.NaN;
  }
  return Date.UTC(
    Number(match.year),
    Number(match.month) - 1,
    Number(match.day),
    Number(match.hour),
    Number(match.minute),
    Number(match.second)
  );
};

/** Why S3 would refuse this presigned request, or null if it accepts it. */
const refusal = (
  request: IncomingMessage,
  url: URL,
  secretAccessKey: string,
  accessKeyId: string
): string | null => {
  const query = url.searchParams;
  const signature = query.get("X-Amz-Signature");
  const credential = query.get("X-Amz-Credential") ?? "";
  const date = query.get("X-Amz-Date") ?? "";
  const expires = Number(query.get("X-Amz-Expires"));
  const signedHeaders = (query.get("X-Amz-SignedHeaders") ?? "").split(";");
  if (!signature) {
    return "AccessDenied: unsigned";
  }
  const [keyId, ...scope] = credential.split("/");
  if (keyId !== accessKeyId) {
    return "InvalidAccessKeyId";
  }
  if (parseAmzDate(date) + expires * 1000 < Date.now()) {
    return "AccessDenied: expired";
  }
  const canonicalQuery = [...query.entries()]
    .filter(([name]) => name !== "X-Amz-Signature")
    .map(([name, value]) => `${encode(name)}=${encode(value)}`)
    .toSorted()
    .join("&");
  const canonicalHeaders = signedHeaders
    .map((name) => `${name}:${String(request.headers[name] ?? "").trim()}\n`)
    .join("");
  const canonicalRequest = [
    request.method,
    url.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders.join(";"),
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    date,
    scope.join("/"),
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  // The signing key: the secret, HMAC'd with each part of the scope in turn.
  let signingKey: Buffer | string = `AWS4${secretAccessKey}`;
  for (const part of scope) {
    signingKey = hmac(signingKey, part);
  }
  const expected = hmac(signingKey, stringToSign).toString("hex");
  return expected === signature ? null : "SignatureDoesNotMatch";
};

const bodyOf = async (request: IncomingMessage): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
};

export const startFakeS3 = async (): Promise<FakeS3> => {
  const { accessKeyId, secretAccessKey } = FAKE_S3_CREDENTIALS;
  const objects: FakeS3["objects"] = new Map();
  let cors: string | undefined;

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://bucket");
    const body = await bodyOf(request);
    const objectPath = url.pathname.slice(1);
    // SDK calls (not presigned) carry an Authorization header instead.
    if (request.headers.authorization) {
      if (request.method === "PUT" && url.searchParams.has("cors")) {
        cors = body.toString();
        response.end();
        return;
      }
      response.statusCode = 501;
      response.end();
      return;
    }
    const refused = refusal(request, url, secretAccessKey, accessKeyId);
    if (refused) {
      response.statusCode = 403;
      response.end(refused);
      return;
    }
    if (request.method === "PUT") {
      objects.set(objectPath, {
        body,
        contentType: request.headers["content-type"],
      });
      response.end();
      return;
    }
    const object = objects.get(objectPath);
    if (request.method !== "GET" || !object) {
      response.statusCode = 404;
      response.end("NoSuchKey");
      return;
    }
    if (object.contentType) {
      response.setHeader("content-type", object.contentType);
    }
    response.end(object.body);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;

  return {
    endpoint: `http://127.0.0.1:${port}`,
    objects,
    cors: () => cors,
    stop: async () => {
      server.close();
      await once(server, "close");
    },
  };
};
