import { createClient } from "@tursodatabase/api";
import type { TursoClientError } from "@tursodatabase/api";

import { TOKEN_LIFETIME_MS } from "@/shared/lib/user-database-host";
import type { UserDatabaseHost } from "@/shared/lib/user-database-host";

export interface TursoHostOptions {
  org: string;
  /** A Platform API token (`turso auth api-tokens mint`). */
  apiToken: string;
  /** The group every Believer's database is created in. */
  group: string;
  /** The Platform API; tests point it at a stand-in. */
  baseUrl?: string;
}

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

/** Believers' cloud databases on Turso Cloud, via the Platform API. */
export const createTursoHost = ({
  org,
  apiToken,
  group,
  baseUrl,
}: TursoHostOptions): UserDatabaseHost => {
  const turso = createClient({
    org,
    token: apiToken,
    ...(baseUrl ? { baseUrl } : {}),
  });

  return {
    ensure: async (name) => {
      try {
        const { hostname } = await turso.databases.create(name, { group });
        return { url: `https://${hostname}` };
      } catch (error) {
        // Created by an earlier (or a concurrent) call: use that one. The
        // package declares TursoClientError but does not export it at
        // runtime (2.0.5), so match on its status.
        if ((error as Partial<TursoClientError>).status === HTTP_CONFLICT) {
          const { hostname } = await turso.databases.get(name);
          return { url: `https://${hostname}` };
        }
        throw error;
      }
    },
    mintToken: async (name, access = "full-access") => {
      const expiresAt = Date.now() + TOKEN_LIFETIME_MS;
      const { jwt } = await turso.databases.createToken(name, {
        expiration: `${TOKEN_LIFETIME_MS / 60_000}m`,
        authorization: access,
      });
      return { token: jwt, expiresAt };
    },
    destroy: async (name) => {
      try {
        await turso.databases.delete(name);
      } catch (error) {
        // Already destroyed (a retried deletion): nothing left to do.
        if ((error as Partial<TursoClientError>).status !== HTTP_NOT_FOUND) {
          throw error;
        }
      }
    },
  };
};
