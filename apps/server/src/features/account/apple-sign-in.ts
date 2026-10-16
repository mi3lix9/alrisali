import {
  APPLE_ID_ORIGIN,
  appleClientSecret,
  applePrivateKeyFromEnv,
} from "@alrisali/auth/apple-client-secret";
import type { AppleKey } from "@alrisali/auth/apple-client-secret";

import type { AppleRevoker } from "@/shared/lib/apple-revoker";

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export interface AppleRevokerOptions {
  key: AppleKey;
  /** Used when the stored ID token does not say which client it was for. */
  defaultClientId: string;
  fetch?: Fetch;
  now?: () => number;
  warn?: (message: string) => void;
}

/** The app (bundle ID) or web Services ID the ID token was issued to. */
const audienceOf = (idToken: string | null): string | undefined => {
  const payload = idToken?.split(".")[1];
  if (!payload) {
    return undefined;
  }
  try {
    const { aud } = JSON.parse(Buffer.from(payload, "base64url").toString());
    const audience: unknown = Array.isArray(aud) ? aud[0] : aud;
    return typeof audience === "string" ? audience : undefined;
  } catch {
    return undefined;
  }
};

export const createAppleRevoker = ({
  key,
  defaultClientId,
  fetch = globalThis.fetch,
  now = Date.now,
  warn = console.warn,
}: AppleRevokerOptions): AppleRevoker => {
  const post = async (path: string, form: Record<string, string>) => {
    const response = await fetch(`${APPLE_ID_ORIGIN}${path}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(form).toString(),
    });
    if (!response.ok) {
      throw new Error(
        `Apple ${path} answered ${response.status}: ${await response.text()}`
      );
    }
    return response;
  };

  return {
    revoke: async (grant, authorizationCode) => {
      const clientId = audienceOf(grant.idToken) ?? defaultClientId;
      const client = {
        client_id: clientId,
        client_secret: appleClientSecret(key, clientId, now()),
      };
      let { refreshToken, accessToken } = grant;
      if (authorizationCode) {
        const exchanged = await post("/auth/token", {
          ...client,
          code: authorizationCode,
          grant_type: "authorization_code",
        });
        const tokens = (await exchanged.json()) as {
          access_token?: string;
          refresh_token?: string;
        };
        refreshToken = tokens.refresh_token ?? null;
        accessToken = tokens.access_token ?? null;
      }
      const [token, hint] = refreshToken
        ? [refreshToken, "refresh_token"]
        : [accessToken, "access_token"];
      if (!token) {
        warn(
          "Sign in with Apple not revoked: no authorization code and no stored Apple token"
        );
        return;
      }
      await post("/auth/revoke", {
        ...client,
        token,
        token_type_hint: hint,
      });
    },
  };
};

export interface AppleRevokerEnv {
  /** The first is the client a token without an audience is revoked for. */
  APPLE_BUNDLE_IDS: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
}

/**
 * Apple's revocation when the Sign in with Apple key is set; otherwise every
 * deletion skips it with a warning naming what is missing.
 */
export const createAppleRevokerFromEnv = (
  env: AppleRevokerEnv,
  options: Pick<AppleRevokerOptions, "fetch" | "warn"> = {}
): AppleRevoker => {
  const { APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY } = env;
  const defaultClientId = env.APPLE_BUNDLE_IDS.split(",")[0]?.trim() ?? "";
  if (APPLE_TEAM_ID && APPLE_KEY_ID && APPLE_PRIVATE_KEY) {
    return createAppleRevoker({
      ...options,
      defaultClientId,
      key: {
        teamId: APPLE_TEAM_ID,
        keyId: APPLE_KEY_ID,
        privateKey: applePrivateKeyFromEnv(APPLE_PRIVATE_KEY),
      },
    });
  }
  const missing = [
    APPLE_TEAM_ID ? null : "APPLE_TEAM_ID",
    APPLE_KEY_ID ? null : "APPLE_KEY_ID",
    APPLE_PRIVATE_KEY ? null : "APPLE_PRIVATE_KEY",
  ].filter((name) => name !== null);
  const warn = options.warn ?? console.warn;
  return {
    revoke: () => {
      warn(
        `Missing ${missing.join(", ")}: Sign in with Apple is not revoked on account deletion`
      );
      return Promise.resolve();
    },
  };
};
