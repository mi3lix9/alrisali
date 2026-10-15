import type { Announcement, Audience } from "@alrisali/domain/announcements";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "Everyone",
  active: "Active Believers (opened the app in the last 7 days)",
  new: "New Believers (joined in the last 30 days)",
};

const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Where an Announcement stands, for the list and the editor. */
export const describeStatus = (announcement: Announcement): string => {
  if (announcement.status === "sent" && announcement.sentAt !== null) {
    return `Sent ${dateTime.format(announcement.sentAt)}`;
  }
  if (
    announcement.status === "scheduled" &&
    announcement.scheduledAt !== null
  ) {
    return `Scheduled for ${dateTime.format(announcement.scheduledAt)}`;
  }
  return "Draft";
};

const pad = (value: number) => String(value).padStart(2, "0");

/** Epoch ms as a `datetime-local` input value, in the browser's time zone. */
export const toLocalInput = (epochMs: number): string => {
  const date = new Date(epochMs);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
