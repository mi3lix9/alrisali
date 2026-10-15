// What an Admin publishes, sent the way the web admin sends it: oRPC's RPC
// protocol (`POST <server>/rpc/<procedure path>` with `{ json: input }`),
// signed in by an Admin's better-auth session cookie. Needs:
// - E2E_SERVER_URL: the server the app under test talks to (the app's
//   EXPO_PUBLIC_SERVER_URL), e.g. http://127.0.0.1:3000.
// - E2E_ADMIN_COOKIE: the `cookie` header of a signed-in Admin's session
//   (sign in on the web admin, copy the request's cookie header).

const { E2E_SERVER_URL, E2E_ADMIN_COOKIE } = process.env;

/** Why an Admin journey is skipped, or false when it can run. */
export const adminSkipReason: string | false =
  E2E_SERVER_URL && E2E_ADMIN_COOKIE
    ? false
    : "needs E2E_SERVER_URL and E2E_ADMIN_COOKIE (an Admin's session)";

/**
 * Calls an Admin procedure, `path` its dotted contract path
 * (`programs.save`). Throws on any refusal, with the server's answer in the
 * message.
 */
export const callAdmin = async (
  path: string,
  input: unknown
): Promise<void> => {
  if (!(E2E_SERVER_URL && E2E_ADMIN_COOKIE)) {
    throw new Error(`Missing env: ${adminSkipReason}`);
  }
  const url = new URL(
    `rpc/${path.replaceAll(".", "/")}`,
    E2E_SERVER_URL.endsWith("/") ? E2E_SERVER_URL : `${E2E_SERVER_URL}/`
  );
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: E2E_ADMIN_COOKIE },
    body: JSON.stringify({ json: input }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${path} answered ${response.status}: ${body}`);
  }
};
