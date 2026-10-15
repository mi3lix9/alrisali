import type { Context } from "@/context";
import { reportServerError } from "@/shared/lib/monitoring";

import { checkReceipts, deliverDueAnnouncements } from "./deliver";
import { deliveryServices } from "./procedures";

/** How often the scheduler looks for due Announcements. */
export const SCHEDULER_INTERVAL_MS = 30 * 1000;

/**
 * One pass of the scheduler: sends the Announcements now due, then checks
 * Expo's receipts and prunes dead tokens.
 */
export const runAnnouncementScheduler = async (
  context: Pick<Context, "content" | "db" | "push">,
  now: number
): Promise<void> => {
  const services = await deliveryServices(context);
  await deliverDueAnnouncements(services, now);
  await checkReceipts(services, now);
};

/**
 * Runs the scheduler every `SCHEDULER_INTERVAL_MS` in this process. A pass
 * still running when the next is due is not overlapped. Several server
 * instances are safe: each due Announcement is claimed by one of them.
 * Returns a function that stops it.
 */
export const startAnnouncementScheduler = (
  context: Pick<Context, "content" | "db" | "push">
): (() => void) => {
  let running = false;
  const timer = setInterval(async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      await runAnnouncementScheduler(context, Date.now());
    } catch (error) {
      reportServerError(error);
    } finally {
      running = false;
    }
  }, SCHEDULER_INTERVAL_MS);
  return () => clearInterval(timer);
};
