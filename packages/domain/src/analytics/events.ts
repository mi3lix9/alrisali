import { z } from "zod";

import { BIRTH_YEAR_MIN } from "./age";

// Usage analytics: what the app reports about how it is used. Events are
// anonymous: they name a screen or a feature, never a Believer's records.
// The device sends them in batches with its install id and metadata; the
// server adds the user id of a signed-in session itself.

/**
 * `screen_view` (a screen was shown, named by its route), `feature_use` (a
 * feature did its job: a Salah logged, a Dhikr Session recorded) and
 * `action` (anything else worth counting: sign-in, sign-out).
 */
export const ANALYTICS_EVENT_TYPES = [
  "screen_view",
  "feature_use",
  "action",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/** The most events one batch may carry. */
export const MAX_BATCH_EVENTS = 100;

const MAX_DATA_ENTRIES = 10;

export const analyticsEventSchema = z.object({
  /** Random, made on the device: a batch sent twice is stored once. */
  id: z.uuid(),
  type: z.enum(ANALYTICS_EVENT_TYPES),
  /** The route (`quran/[page]`) or feature (`prayer-log`) it is about. */
  name: z.string().trim().min(1).max(100),
  /** Epoch milliseconds on the device's clock. */
  occurredAt: z.number().int().nonnegative(),
  /** A few details (`{ salah: "fajr" }`); never personal data. */
  data: z
    .record(
      z.string().max(50),
      z.union([z.string().max(200), z.number(), z.boolean()])
    )
    .refine((data) => Object.keys(data).length <= MAX_DATA_ENTRIES, {
      message: `At most ${MAX_DATA_ENTRIES} entries`,
    })
    .optional(),
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;

export const DEVICE_PLATFORMS = ["ios", "android", "web"] as const;
export const DEVICE_TYPES = ["phone", "tablet", "desktop"] as const;

export const analyticsDeviceSchema = z.object({
  platform: z.enum(DEVICE_PLATFORMS),
  osVersion: z.string().trim().min(1).max(50),
  appVersion: z.string().trim().min(1).max(50),
  deviceType: z.enum(DEVICE_TYPES),
  /** The birth year the Believer chose to give on this device, if any. */
  birthYear: z.number().int().min(BIRTH_YEAR_MIN).nullable(),
});

export type AnalyticsDevice = z.infer<typeof analyticsDeviceSchema>;

export const analyticsBatchSchema = z.object({
  /** Random per installation; reset when the account is deleted. */
  installId: z.uuid(),
  device: analyticsDeviceSchema,
  events: z.array(analyticsEventSchema).min(1).max(MAX_BATCH_EVENTS),
});

export type AnalyticsBatch = z.infer<typeof analyticsBatchSchema>;
