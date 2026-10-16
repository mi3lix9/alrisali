import { ORPCError } from "@orpc/server";
import * as Sentry from "@sentry/node";

export interface MonitoringOptions {
  /** Sentry DSN. Without one, errors are only logged. */
  dsn: string | undefined;
  environment: string;
}

/** Starts Sentry when a DSN is configured. */
export const initMonitoring = ({ dsn, environment }: MonitoringOptions) => {
  if (!dsn) {
    return;
  }
  Sentry.init({ dsn, environment });
};

/**
 * Logs an error and sends it to Sentry, unless it is an expected client
 * error (an ORPCError below 500, such as UNAUTHORIZED or NOT_FOUND).
 */
export const reportServerError = (error: unknown) => {
  if (error instanceof ORPCError && error.status < 500) {
    return;
  }
  console.error(error);
  Sentry.captureException(error);
};

/** Waits for queued Sentry events to be sent. */
export const flushMonitoring = (timeoutMs = 2000) => Sentry.flush(timeoutMs);
