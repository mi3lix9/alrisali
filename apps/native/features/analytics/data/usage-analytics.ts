import { analyticsEventSchema } from "@alrisali/domain/analytics";
import type { AnalyticsDevice } from "@alrisali/domain/analytics";
import { ORPCError } from "@orpc/client";
import Constants from "expo-constants";
import { randomUUID } from "expo-crypto";
import { File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import { AppState, Dimensions, Platform } from "react-native";
import { z } from "zod";

import { deviceEntry } from "@/shared/lib/device-entries";
import { events } from "@/shared/lib/events";
import { client } from "@/shared/lib/orpc";

import { createAnalyticsQueue } from "../utils/analytics-queue";
import type { TrackedEvent } from "../utils/analytics-queue";
import { useBirthYear } from "./birth-year";

// Usage analytics, our own (no third-party platform). The app counts screen
// views and feature use, keeps them in an outbox file and sends them in
// batches with an anonymous install id and the device's metadata. The
// server links a batch to the Believer only when it arrives with their
// session. Account deletion forgets the install id (a device entry), so the
// device then reports as a new installation.

const INSTALL_ID_KEY = deviceEntry("alrisali.analytics-install-id");

/** Phones and tablets are told apart by their shorter side, in points. */
const TABLET_MIN_SIDE = 600;

const installId = (): string => {
  const stored = SecureStore.getItem(INSTALL_ID_KEY);
  if (stored) {
    return stored;
  }
  const created = randomUUID();
  SecureStore.setItem(INSTALL_ID_KEY, created);
  return created;
};

const deviceType = (): AnalyticsDevice["deviceType"] => {
  if (Platform.OS === "ios") {
    return Platform.isPad ? "tablet" : "phone";
  }
  if (Platform.OS === "android") {
    const { width, height } = Dimensions.get("screen");
    return Math.min(width, height) >= TABLET_MIN_SIDE ? "tablet" : "phone";
  }
  return "desktop";
};

const device = (): AnalyticsDevice => ({
  platform:
    Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web",
  osVersion: String(Platform.Version),
  appVersion: Constants.expoConfig?.version ?? "unknown",
  deviceType: deviceType(),
  birthYear: useBirthYear.getState().birthYear,
});

const outbox = new File(Paths.document, "analytics-outbox.json");
const storedEvents = z.array(analyticsEventSchema);

const queue = createAnalyticsQueue({
  store: {
    load: async () =>
      outbox.exists ? storedEvents.parse(JSON.parse(await outbox.text())) : [],
    save: async (queued) => {
      if (!outbox.exists) {
        outbox.create();
      }
      await outbox.write(JSON.stringify(queued));
    },
  },
  send: async (batch) => {
    await client.analytics.track({
      installId: installId(),
      device: device(),
      events: batch,
    });
  },
  isRefusal: (error) =>
    error instanceof ORPCError && error.code === "BAD_REQUEST",
  now: Date.now,
  newId: randomUUID,
});

/**
 * Counts a screen view, a use of a feature or an action. Analytics never get
 * in the Believer's way: a failure here is dropped.
 */
export const trackEvent = async (event: TrackedEvent): Promise<void> => {
  try {
    await queue.track(event);
  } catch {
    // Dropped: see above.
  }
};

/** Sends what waits, unless a recent failure asks to wait. */
const flush = async (): Promise<void> => {
  try {
    await queue.flush();
  } catch {
    // Kept in the outbox for the next try.
  }
};

let started = false;

/**
 * Sends what waits now and whenever the app comes to the foreground or
 * leaves it, and counts the cross-feature events. Runs once per launch.
 */
export const startUsageAnalytics = (): void => {
  if (started) {
    return;
  }
  started = true;
  flush();
  AppState.addEventListener("change", (state) => {
    if (state === "active" || state === "background") {
      flush();
    }
  });
  events.on("SalahLogged", ({ salah }) => {
    trackEvent({ type: "feature_use", name: "prayer-log", data: { salah } });
  });
  events.on("DhikrSessionCompleted", ({ count }) => {
    trackEvent({ type: "feature_use", name: "tasbih", data: { count } });
  });
  events.on("SignedIn", () => {
    trackEvent({ type: "action", name: "sign-in" });
  });
  events.on("SignedOut", () => {
    trackEvent({ type: "action", name: "sign-out" });
  });
};
