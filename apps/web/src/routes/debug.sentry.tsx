import { createFileRoute, notFound } from "@tanstack/react-router";

import { ENV } from "@/env";
import { SentryTestErrorScreen } from "@/shared/ui/sentry-test-error";

export const Route = createFileRoute("/debug/sentry")({
  beforeLoad: () => {
    if (ENV.NODE_ENV === "production") {
      throw notFound();
    }
  },
  component: SentryTestErrorScreen,
});
