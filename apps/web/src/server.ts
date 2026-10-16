import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { initMonitoring } from "./shared/lib/monitoring";

initMonitoring();

export default createServerEntry(
  wrapFetchWithSentry({
    fetch(request) {
      return handler.fetch(request);
    },
  })
);
