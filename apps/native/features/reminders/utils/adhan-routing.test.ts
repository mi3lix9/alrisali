import { describe, expect, it } from "vitest";

import { routeReminders } from "./adhan-routing";
import type { ReminderRequest } from "./notification-request";

const request = (
  id: string,
  adhanService: ReminderRequest["adhanService"] = null
): ReminderRequest => ({
  id,
  fingerprint: id,
  fireAt: 1000,
  title: "Maghrib",
  body: "It's time",
  channelId: "at-time-default",
  sound: "default",
  adhanOnOpen: null,
  adhanService,
});

const service = { file: "adhan.wav", stopLabel: "Stop", channelName: "Adhan" };

describe(routeReminders, () => {
  it("hands full-adhan alarms to the adhan service and keeps the rest as notifications", () => {
    const { notifications, adhanAlarms } = routeReminders(
      [
        request("prayer:2026-10-15:maghrib:at-time", service),
        request("prayer:2026-10-15:maghrib:before"),
      ],
      true
    );
    expect(notifications.map(({ id }) => id)).toStrictEqual([
      "prayer:2026-10-15:maghrib:before",
    ]);
    expect(adhanAlarms).toStrictEqual([
      {
        id: "prayer:2026-10-15:maghrib:at-time",
        fireAt: 1000,
        title: "Maghrib",
        body: "It's time",
        file: "adhan.wav",
        stopLabel: "Stop",
        channelName: "Adhan",
      },
    ]);
  });

  it("keeps the full adhan a notification where there is no adhan service", () => {
    const { notifications, adhanAlarms } = routeReminders(
      [request("prayer:2026-10-15:maghrib:at-time", service)],
      false
    );
    expect(notifications).toHaveLength(1);
    expect(adhanAlarms).toStrictEqual([]);
  });
});
