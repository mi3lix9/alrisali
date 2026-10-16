import { createFileRoute } from "@tanstack/react-router";

import { ENV } from "@/env";
import { assetLinks } from "@/features/app-links";

// Tells Android which app may open this domain's links (verified App Links).
export const Route = createFileRoute("/.well-known/assetlinks.json")({
  server: {
    handlers: {
      GET: () => {
        const file = assetLinks(ENV.ANDROID_CERT_SHA256);
        return file
          ? Response.json(file)
          : new Response("Not found", { status: 404 });
      },
    },
  },
});
