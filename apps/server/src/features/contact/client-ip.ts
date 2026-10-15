/** The part of Bun's server (Hono's `c.env` under Bun) that knows sockets. */
interface SocketAware {
  requestIP?: (request: Request) => { address: string } | null;
}

/**
 * The caller's IP address. In production the server runs behind Railway's
 * edge proxy, which sets `X-Real-IP` to the address it saw (overwriting
 * whatever the client sent), so the socket address is only the proxy's.
 * Without the header (local development) it is the socket's, from Bun.
 */
export const clientIpOf = (
  request: Request,
  server?: unknown
): string | null => {
  const forwarded = request.headers.get("x-real-ip")?.trim();
  if (forwarded) {
    return forwarded;
  }
  const { requestIP } = (server ?? {}) as SocketAware;
  return typeof requestIP === "function"
    ? (requestIP.call(server, request)?.address ?? null)
    : null;
};
