import * as Sentry from "@sentry/tanstackstart-react";

import { ENV } from "@/env";

/**
 * Starts Sentry when VITE_SENTRY_DSN is set. The package resolves to its
 * browser or server build, so the same call covers both sides of SSR.
 */
export const initMonitoring = () => {
  if (!ENV.VITE_SENTRY_DSN || Sentry.isInitialized()) {
    return;
  }
  Sentry.init({
    dsn: ENV.VITE_SENTRY_DSN,
    environment: ENV.NODE_ENV,
  });
};

export const reportError = (error: unknown) => {
  Sentry.captureException(error);
};
