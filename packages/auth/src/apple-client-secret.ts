import { createPrivateKey, sign } from "node:crypto";

/** The Sign in with Apple key (.p8) from the Apple Developer account. */
export interface AppleKey {
  teamId: string;
  keyId: string;
  /** PKCS#8 PEM: the contents of the .p8 file. */
  privateKey: string;
}

export const APPLE_ID_ORIGIN = "https://appleid.apple.com";

/** Each secret is minted for the requests at hand, not stored. */
export const APPLE_CLIENT_SECRET_LIFETIME_S = 300;

const base64url = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

/**
 * The ES256 JWT Apple's REST API takes as `client_secret` from `clientId`
 * (an app's bundle ID or the web Services ID).
 */
export const appleClientSecret = (
  key: AppleKey,
  clientId: string,
  now = Date.now()
): string => {
  const iat = Math.floor(now / 1000);
  const unsigned = `${base64url({ alg: "ES256", kid: key.keyId })}.${base64url({
    iss: key.teamId,
    iat,
    exp: iat + APPLE_CLIENT_SECRET_LIFETIME_S,
    aud: APPLE_ID_ORIGIN,
    sub: clientId,
  })}`;
  const signature = sign("sha256", Buffer.from(unsigned), {
    key: createPrivateKey(key.privateKey),
    dsaEncoding: "ieee-p1363",
  });
  return `${unsigned}.${signature.toString("base64url")}`;
};

/** Hosts that keep variables on one line escape the PEM's newlines. */
export const applePrivateKeyFromEnv = (value: string): string =>
  value.replaceAll("\\n", "\n");
