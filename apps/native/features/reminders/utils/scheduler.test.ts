import { Temporal } from "temporal-polyfill";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReminderRequest } from "./notification-request";
import { staleDeliveredIds, syncReminders } from "./scheduler";

const permissions = { granted: false };
const scheduleAdhanAlarms = vi.hoisted(() =>
  vi.fn<(alarms: unknown[]) => void>()
);

vi.mock(
  import("expo-notifications"),
  () =>
    ({
      AndroidImportance: { HIGH: 4 },
      SchedulableTriggerInputTypes: { DATE: "date" },
      cancelScheduledNotificationAsync: vi.fn<() => Promise<void>>(),
      dismissNotificationAsync: vi.fn<() => Promise<void>>(),
      getAllScheduledNotificationsAsync: vi.fn<() => Promise<never[]>>(() =>
        Promise.resolve([])
      ),
      getPermissionsAsync: vi.fn<() => Promise<typeof permissions>>(() =>
        Promise.resolve(permissions)
      ),
      getPresentedNotificationsAsync: vi.fn<() => Promise<never[]>>(() =>
        Promise.resolve([])
      ),
      scheduleNotificationAsync: vi.fn<() => Promise<string>>(),
      setNotificationChannelAsync: vi.fn<() => Promise<null>>(),
      setNotificationHandler: vi.fn<() => void>(),
    }) as never
);
vi.mock(
  import("react-native"),
  () => ({ Platform: { OS: "android" } }) as never
);
vi.mock(
  import("@/shared/lib/android-alerts"),
  () =>
    ({
      androidAlerts: { scheduleAdhanAlarms },
    }) as never
);
vi.mock(
  import("./notification-request"),
  () => ({ REMINDER_CHANNELS: [] }) as never
);

const request = {
  id: "prayer:2026-10-15:maghrib:at-time",
  fingerprint: "f",
  fireAt: Date.now() + 60_000,
  title: "Maghrib",
  body: "It's time",
  channelId: "at-time-adhan",
  sound: null,
  adhanOnOpen: null,
  adhanService: { file: "adhan.wav", stopLabel: "Stop", channelName: "Adhan" },
} satisfies ReminderRequest;

describe(syncReminders, () => {
  beforeEach(() => {
    scheduleAdhanAlarms.mockClear();
  });

  it("disarms the native adhan alarms when notification permission is denied", async () => {
    permissions.granted = false;
    await syncReminders([request]);
    expect(scheduleAdhanAlarms).toHaveBeenCalledExactlyOnceWith([]);
  });

  it("arms them when permission is granted", async () => {
    permissions.granted = true;
    await syncReminders([request]);
    expect(scheduleAdhanAlarms).toHaveBeenCalledOnce();
    expect(scheduleAdhanAlarms.mock.calls[0]?.[0]).toHaveLength(1);
  });
});

describe(staleDeliveredIds, () => {
  const now = Temporal.Instant.from("2026-10-15T12:00:00Z");
  const data = (minutesAgo: number) => ({
    reminder: true,
    fingerprint: "f",
    fireAt: now.subtract({ minutes: minutesAgo }).epochMilliseconds,
  });

  it("names the delivered Reminders over 30 minutes late only", () => {
    expect(
      staleDeliveredIds(
        [
          { identifier: "late", data: data(45) },
          { identifier: "fresh", data: data(5) },
          { identifier: "other", data: { unrelated: true } },
        ],
        now
      )
    ).toStrictEqual(["late"]);
  });
});
