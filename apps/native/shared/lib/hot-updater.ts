import { HotUpdater } from "@hot-updater/react-native";
import * as Sentry from "@sentry/react-native";

import { ENV } from "@/src/env";

// The update strategy `hot-updater.config.ts` deploys with.
const UPDATE_STRATEGY = "appVersion";

const reportUpdateError = (error: unknown) => {
  Sentry.captureException(error);
};

const apiKey = ENV.EXPO_PUBLIC_HOT_UPDATER_API_KEY;

/**
 * Over-the-air JavaScript updates from the server's Hot Updater routes.
 * Production builds always have the client API key (the env schema requires
 * it); development builds load their JavaScript from Metro and have none.
 */
export const hotUpdater = apiKey
  ? HotUpdater.init({
      baseURL: `${ENV.EXPO_PUBLIC_SERVER_URL}/hot-updater`,
      requestHeaders: { "x-api-key": apiKey },
      onError: reportUpdateError,
    })
  : undefined;

/**
 * Checks for an update and downloads it in the background; it applies on the
 * next launch. A release marked "force update" reloads the app at once.
 */
export const applyOtaUpdate = async (): Promise<void> => {
  if (!hotUpdater || __DEV__) {
    return;
  }
  try {
    const update = await hotUpdater.checkForUpdate({
      updateStrategy: UPDATE_STRATEGY,
    });
    if (!update) {
      return;
    }
    const downloaded = await update.updateBundle();
    if (downloaded && update.shouldForceUpdate) {
      await hotUpdater.reload();
    }
  } catch (error) {
    reportUpdateError(error);
  }
};
