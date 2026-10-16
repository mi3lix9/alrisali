import { generateKeyPairSync, verify } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { createAppleRevoker, createAppleRevokerFromEnv } from "./apple-sign-in";

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256",
});
const PRIVATE_KEY = privateKey
  .export({ format: "pem", type: "pkcs8" })
  .toString();

const KEY = {
  teamId: "TEAM123456",
  keyId: "KEY1234567",
  privateKey: PRIVATE_KEY,
};

const unsignedToken = (claims: Record<string, unknown>) =>
  [{ alg: "RS256" }, claims, "signature"]
    .map((part) =>
      typeof part === "string"
        ? part
        : Buffer.from(JSON.stringify(part)).toString("base64url")
    )
    .join(".");

interface AppleRequest {
  url: string;
  form: URLSearchParams;
}

/** Apple's REST endpoints: records each request and answers in turn. */
const fakeApple = (...responses: Response[]) => {
  const requests: AppleRequest[] = [];
  const fetch = vi.fn<
    (url: string | URL | Request, init?: RequestInit) => Promise<Response>
  >((url, init) => {
    requests.push({
      url: String(url),
      form: new URLSearchParams(String(init?.body)),
    });
    return Promise.resolve(responses.shift() ?? new Response(null));
  });
  return { fetch, requests };
};

const json = (body: unknown) => Response.json(body);

const claimsOf = (jwt: string) => {
  const [header = "", payload = "", signature = ""] = jwt.split(".");
  const signed = verify(
    "sha256",
    Buffer.from(`${header}.${payload}`),
    { key: publicKey, dsaEncoding: "ieee-p1363" },
    Buffer.from(signature, "base64url")
  );
  return {
    signed,
    header: JSON.parse(Buffer.from(header, "base64url").toString()),
    payload: JSON.parse(Buffer.from(payload, "base64url").toString()),
  };
};

const NOW = Date.UTC(2026, 9, 16);

describe(createAppleRevoker, () => {
  it("exchanges a fresh authorization code and revokes its refresh token", async () => {
    const apple = fakeApple(
      json({ access_token: "access", refresh_token: "refresh" }),
      new Response(null)
    );
    const revoker = createAppleRevoker({
      key: KEY,
      defaultClientId: "com.alrisali.app",
      fetch: apple.fetch,
      now: () => NOW,
    });

    await revoker.revoke(
      {
        idToken: unsignedToken({ aud: "com.alrisali.app.dev" }),
        accessToken: null,
        refreshToken: null,
      },
      "fresh-code"
    );

    expect(
      apple.requests.map(({ url, form }) => ({
        url,
        form: Object.fromEntries(form),
      }))
    ).toStrictEqual([
      {
        url: "https://appleid.apple.com/auth/token",
        form: {
          client_id: "com.alrisali.app.dev",
          client_secret: expect.any(String),
          code: "fresh-code",
          grant_type: "authorization_code",
        },
      },
      {
        url: "https://appleid.apple.com/auth/revoke",
        form: {
          client_id: "com.alrisali.app.dev",
          client_secret: expect.any(String),
          token: "refresh",
          token_type_hint: "refresh_token",
        },
      },
    ]);
    expect(
      claimsOf(apple.requests[1]?.form.get("client_secret") ?? "")
    ).toStrictEqual({
      signed: true,
      header: { alg: "ES256", kid: "KEY1234567" },
      payload: {
        iss: "TEAM123456",
        iat: NOW / 1000,
        exp: NOW / 1000 + 300,
        aud: "https://appleid.apple.com",
        sub: "com.alrisali.app.dev",
      },
    });
  });

  it("revokes the stored refresh token without a fresh code", async () => {
    const apple = fakeApple(new Response(null));
    const revoker = createAppleRevoker({
      key: KEY,
      defaultClientId: "com.alrisali.app",
      fetch: apple.fetch,
    });

    await revoker.revoke({
      idToken: null,
      accessToken: "stored-access",
      refreshToken: "stored-refresh",
    });

    expect(apple.requests).toHaveLength(1);
    expect(apple.requests[0]?.form.get("client_id")).toBe("com.alrisali.app");
    expect(apple.requests[0]?.form.get("token")).toBe("stored-refresh");
  });

  it("revokes a stored access token when there is no refresh token", async () => {
    const apple = fakeApple(new Response(null));
    const revoker = createAppleRevoker({
      key: KEY,
      defaultClientId: "com.alrisali.app",
      fetch: apple.fetch,
    });

    await revoker.revoke({
      idToken: unsignedToken({ aud: ["services.id.web"] }),
      accessToken: "stored-access",
      refreshToken: null,
    });

    expect(apple.requests[0]?.form.get("client_id")).toBe("services.id.web");
    expect(apple.requests[0]?.form.get("token")).toBe("stored-access");
    expect(apple.requests[0]?.form.get("token_type_hint")).toBe("access_token");
  });

  it("fails when Apple refuses the revocation", async () => {
    const apple = fakeApple(
      Response.json({ error: "invalid_client" }, { status: 400 })
    );
    const revoker = createAppleRevoker({
      key: KEY,
      defaultClientId: "com.alrisali.app",
      fetch: apple.fetch,
    });

    await expect(
      revoker.revoke({ idToken: null, accessToken: null, refreshToken: "r" })
    ).rejects.toThrow("Apple /auth/revoke answered 400");
  });

  it("fails when the authorization code cannot be exchanged", async () => {
    const apple = fakeApple(
      Response.json({ error: "invalid_grant" }, { status: 400 })
    );
    const revoker = createAppleRevoker({
      key: KEY,
      defaultClientId: "com.alrisali.app",
      fetch: apple.fetch,
    });

    await expect(
      revoker.revoke(
        { idToken: null, accessToken: null, refreshToken: null },
        "expired-code"
      )
    ).rejects.toThrow("Apple /auth/token answered 400");
    expect(apple.requests).toHaveLength(1);
  });

  it("skips with a warning when it has nothing to revoke", async () => {
    const apple = fakeApple();
    const warn = vi.fn<(message: string) => void>();
    const revoker = createAppleRevoker({
      key: KEY,
      defaultClientId: "com.alrisali.app",
      fetch: apple.fetch,
      warn,
    });

    await revoker.revoke({
      idToken: null,
      accessToken: null,
      refreshToken: null,
    });

    expect(apple.fetch).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe(createAppleRevokerFromEnv, () => {
  it("skips revocation with a warning naming the missing variables", async () => {
    const warn = vi.fn<(message: string) => void>();
    const revoker = createAppleRevokerFromEnv(
      { APPLE_BUNDLE_IDS: "com.alrisali.app", APPLE_TEAM_ID: "TEAM123456" },
      { warn }
    );

    await revoker.revoke(
      { idToken: null, accessToken: null, refreshToken: "r" },
      "code"
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Missing APPLE_KEY_ID, APPLE_PRIVATE_KEY")
    );
  });

  it("reads a private key whose newlines were escaped", async () => {
    const apple = fakeApple(new Response(null));
    const revoker = createAppleRevokerFromEnv(
      {
        APPLE_BUNDLE_IDS: "com.alrisali.app",
        APPLE_TEAM_ID: KEY.teamId,
        APPLE_KEY_ID: KEY.keyId,
        APPLE_PRIVATE_KEY: PRIVATE_KEY.replaceAll("\n", "\\n"),
      },
      { fetch: apple.fetch }
    );

    await revoker.revoke({
      idToken: null,
      accessToken: null,
      refreshToken: "r",
    });

    const secret = apple.requests[0]?.form.get("client_secret") ?? "";
    expect(claimsOf(secret).signed).toBeTruthy();
  });
});
