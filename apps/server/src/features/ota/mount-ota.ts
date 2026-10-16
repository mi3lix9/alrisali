import type { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";

import type { OtaServer } from "./create-ota-server";

/** Where the app's Hot Updater `baseURL` points, under the server origin. */
const OTA_PATH = "/hot-updater";

/**
 * Mounts Hot Updater: the admin routes behind the CLI's bearer token, then
 * the client routes the app checks for updates on.
 */
export const mountOta = (
  app: Hono,
  ota: OtaServer,
  adminToken: string
): void => {
  app.use(`${OTA_PATH}/admin/*`, bearerAuth({ token: adminToken }));
  app.mount(`${OTA_PATH}/admin`, ota.handlers.admin);
  app.mount(OTA_PATH, ota.handlers.client);
};
