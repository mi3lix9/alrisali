import type { Audience } from "./announcement";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Active Believers opened the app within this many days of the sending. */
export const ACTIVE_WITHIN_DAYS = 7;

/** New Believers joined within this many days of the sending. */
export const NEW_WITHIN_DAYS = 30;

/** What the server knows of a device that can receive an Announcement. */
export interface Recipient {
  /** When the app on this device last checked in (epoch ms). */
  lastSeenAt: number;
  /**
   * When this Believer joined (epoch ms): their account's creation when
   * signed in, else the device's first check-in, whichever is earlier.
   */
  joinedAt: number;
}

/** Whether a device belongs to the audience of an Announcement sent `now`. */
export const inAudience = (
  audience: Audience,
  recipient: Recipient,
  now: number
): boolean => {
  switch (audience) {
    case "all": {
      return true;
    }
    case "active": {
      return recipient.lastSeenAt >= now - ACTIVE_WITHIN_DAYS * DAY_MS;
    }
    case "new": {
      return recipient.joinedAt >= now - NEW_WITHIN_DAYS * DAY_MS;
    }
    default: {
      return false;
    }
  }
};
