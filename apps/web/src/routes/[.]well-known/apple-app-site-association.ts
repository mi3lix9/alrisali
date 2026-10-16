import { createFileRoute } from "@tanstack/react-router";

import { ENV } from "@/env";
import { appleAppSiteAssociation } from "@/features/app-links";

// Tells iOS which paths of this domain open the app (universal links).
export const Route = createFileRoute("/.well-known/apple-app-site-association")(
  {
    server: {
      handlers: {
        GET: () => {
          const file = appleAppSiteAssociation(ENV.APPLE_TEAM_ID);
          return file
            ? Response.json(file)
            : new Response("Not found", { status: 404 });
        },
      },
    },
  }
);
