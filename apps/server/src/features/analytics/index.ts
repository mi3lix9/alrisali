import { admin, os } from "@/shared/lib/orpc";

import { recordBatch } from "./ingest";
import {
  ages,
  dailyActiveUsers,
  devices,
  featureUsage,
  guestShare,
  popularSections,
  retention,
  summary,
} from "./reports";

/** Open to Guests; a signed-in caller's events carry their user id. */
const track = os.analytics.track.handler(({ context, input }) =>
  recordBatch(context.db, {
    batch: input,
    userId: context.session?.user.id ?? null,
    now: Date.now(),
  })
);

export const analyticsRouter = {
  track,
  summary: admin.analytics.summary.handler(({ context }) =>
    summary(context.db, Date.now())
  ),
  popularSections: admin.analytics.popularSections.handler(
    ({ context, input }) => popularSections(context.db, input, Date.now())
  ),
  dailyActiveUsers: admin.analytics.dailyActiveUsers.handler(
    ({ context, input }) => dailyActiveUsers(context.db, input, Date.now())
  ),
  featureUsage: admin.analytics.featureUsage.handler(({ context, input }) =>
    featureUsage(context.db, input, Date.now())
  ),
  retention: admin.analytics.retention.handler(({ context, input }) =>
    retention(context.db, input, Date.now())
  ),
  guestShare: admin.analytics.guestShare.handler(({ context, input }) =>
    guestShare(context.db, input, Date.now())
  ),
  devices: admin.analytics.devices.handler(({ context, input }) =>
    devices(context.db, input, Date.now())
  ),
  ages: admin.analytics.ages.handler(({ context, input }) =>
    ages(context.db, input, Date.now())
  ),
};
