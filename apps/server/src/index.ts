import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import { startAnnouncementScheduler } from "@/features/announcements";
import { createOtaServer, mountOta, readOtaConfig } from "@/features/ota";

import { createContext } from "./context";
import { ENV } from "./env.server";
import { appRouter } from "./router";
import { auth, content, db, push, recitation, userDatabases } from "./services";
import { createApiHandler, createRpcHandler } from "./shared/lib/handlers";
import { initMonitoring, reportServerError } from "./shared/lib/monitoring";

initMonitoring({ dsn: ENV.SENTRY_DSN, environment: ENV.NODE_ENV });

const app = new Hono();

// oxlint-disable-next-line promise/prefer-await-to-callbacks -- Hono's error hook is callback-based
app.onError((error, c) => {
  // Expected refusals, such as the OTA admin routes' 401, keep their status.
  if (error instanceof HTTPException) {
    return error.getResponse();
  }
  reportServerError(error);
  return c.text("Internal Server Error", 500);
});

app.use(logger());
app.use(
  "/*",
  cors({
    origin: ENV.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Over-the-air updates (Hot Updater). Required in production by the env
// schema; off in local development until the HOT_UPDATER_* variables are set.
const otaConfig = readOtaConfig(ENV);
if (otaConfig) {
  mountOta(app, createOtaServer(otaConfig, db), otaConfig.adminToken);
}

// Sends scheduled Announcements when they fall due (Expo Push).
if (ENV.NODE_ENV !== "test") {
  startAnnouncementScheduler({ content, db, push });
}

const apiHandler = createApiHandler(appRouter);
const rpcHandler = createRpcHandler(appRouter);

app.use("/*", async (c, next) => {
  const context = await createContext({
    auth,
    db,
    userDatabases,
    content,
    recitation,
    push,
    headers: c.req.raw.headers,
  });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  return next();
});

app.get("/", (c) => c.text("OK"));

if (ENV.NODE_ENV !== "production") {
  // Forced error for checking that Sentry receives server errors.
  app.get("/debug/sentry", () => {
    throw new Error("Sentry test error (server)");
  });
}

export default app;
