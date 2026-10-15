import * as Sentry from "@sentry/react-native";

import { ENV } from "@/src/env";

/** Starts Sentry when EXPO_PUBLIC_SENTRY_DSN is set. */
export const initMonitoring = () => {
  if (!ENV.EXPO_PUBLIC_SENTRY_DSN) {
    return;
  }
  Sentry.init({
    dsn: ENV.EXPO_PUBLIC_SENTRY_DSN,
    environment: ENV.NODE_ENV,
  });
};

/**
 * Wraps the root layout so render errors and native crashes reach Sentry.
 * Without a DSN Sentry never starts, and wrapping would only warn that
 * `Sentry.wrap` ran before `Sentry.init`.
 */
export const withMonitoring: typeof Sentry.wrap = (component, options) =>
  ENV.EXPO_PUBLIC_SENTRY_DSN ? Sentry.wrap(component, options) : component;
