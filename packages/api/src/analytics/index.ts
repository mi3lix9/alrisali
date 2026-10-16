import { AGE_BANDS, analyticsBatchSchema } from "@alrisali/domain/analytics";
import { oc } from "@orpc/contract";
import { z } from "zod";

const count = z.number().int().nonnegative();
/** Rounded to a whole percent of the report's total. */
const percentage = z.number().int().min(0).max(100);

const MAX_REPORT_DAYS = 365;

/** How many days back from now a report covers. */
const reportWindow = z.object({
  days: z.number().int().min(1).max(MAX_REPORT_DAYS),
});

const share = z.object({ name: z.string(), count, percentage });

const usage = z.object({
  name: z.string(),
  count,
  /** Distinct installations behind `count`. */
  installs: count,
  percentage,
});

/**
 * Usage analytics. Devices send batched, anonymous events (`track`, open to
 * Guests); Admins read the reports, computed here on the server. Days are UTC
 * days; "active" means an installation sent at least one event.
 */
export const analyticsContract = {
  /**
   * Stores a batch. Events already stored (same id) are skipped, so a device
   * can resend a batch whose reply it never got. Events dated more than 30
   * days ago or in the future are dropped. A signed-in caller's events carry
   * their user id.
   */
  track: oc
    .input(analyticsBatchSchema)
    .output(z.object({ accepted: count, dropped: count })),

  summary: oc.output(
    z.object({
      installs: count,
      believers: count,
      activeToday: count,
      activeWeek: count,
      activeMonth: count,
      events: count,
      eventsToday: count,
    })
  ),
  /** The most viewed screens, as a share of every screen view. */
  popularSections: oc.input(reportWindow).output(z.array(usage)),
  /** Active installations and signed-in Believers per day, oldest first. */
  dailyActiveUsers: oc
    .input(
      reportWindow.extend({
        /** Shifts the window back by whole windows: 1 is the one before. */
        offset: z.number().int().min(0).max(MAX_REPORT_DAYS),
      })
    )
    .output(
      z.array(
        z.object({ date: z.iso.date(), installs: count, believers: count })
      )
    ),
  /** The most used features, as a share of every feature use. */
  featureUsage: oc.input(reportWindow).output(z.array(usage)),
  /**
   * Of the installations first seen in the last `cohortDays` days, the share
   * still active 1, 7 and 30 days after their first event. Only those first
   * seen at least that long ago are counted (`eligible`).
   */
  retention: oc
    .input(
      z.object({ cohortDays: z.number().int().min(1).max(MAX_REPORT_DAYS) })
    )
    .output(
      z.object({
        cohort: count,
        days: z.array(
          z.object({ day: count, eligible: count, retained: count, percentage })
        ),
      })
    ),
  /**
   * Guests against signed-in Believers: events, and active installations (an
   * installation counts as a Believer's when any of its events in the window
   * was sent signed in).
   */
  guestShare: oc.input(reportWindow).output(
    z.object({
      events: z.object({
        guest: count,
        believer: count,
        guestPercentage: percentage,
      }),
      installs: z.object({
        guest: count,
        believer: count,
        guestPercentage: percentage,
      }),
    })
  ),
  /** Installations active in the window, by platform, type and version. */
  devices: oc.input(reportWindow).output(
    z.object({
      installs: count,
      platforms: z.array(share),
      deviceTypes: z.array(share),
      osVersions: z.array(share),
      appVersions: z.array(share),
    })
  ),
  /**
   * Age bands of the people active in the window who gave a birth year. A
   * signed-in Believer counts once across their devices.
   */
  ages: oc.input(reportWindow).output(
    z.object({
      bands: z.array(z.object({ band: z.enum(AGE_BANDS), count, percentage })),
      withBirthYear: count,
      withoutBirthYear: count,
    })
  ),
};
