import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import type { AnyRouter } from "@orpc/server";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

import { reportServerError } from "./monitoring";

/** Serves the router over oRPC's RPC protocol, reporting failures to Sentry. */
export const createRpcHandler = <T extends AnyRouter>(router: T) =>
  new RPCHandler(router, { interceptors: [onError(reportServerError)] });

/** Serves the router as OpenAPI with a reference page, reporting failures to Sentry. */
export const createApiHandler = <T extends AnyRouter>(router: T) =>
  new OpenAPIHandler(router, {
    plugins: [
      new OpenAPIReferencePlugin({
        schemaConverters: [new ZodToJsonSchemaConverter()],
      }),
    ],
    interceptors: [onError(reportServerError)],
  });
