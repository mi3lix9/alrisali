/**
 * How many new records a Guest makes before being nudged to sign in: enough
 * that losing them would matter, so a first tap never triggers it.
 */
export const GUEST_NUDGE_THRESHOLD = 10;

export interface GuestNudgeInput {
  /** Records currently only on this device. */
  records: number;
  /** The record count when the Guest last dismissed the nudge, if ever. */
  dismissedAt: number | null;
}

/**
 * Whether to tell a Guest how many records are only on this device: once
 * `GUEST_NUDGE_THRESHOLD` records were made since the last dismissal (or
 * ever). It follows the records, never the clock. A device holding fewer
 * records than at dismissal (a wiped database) counts from zero again.
 */
export const shouldNudgeGuest = ({
  records,
  dismissedAt,
}: GuestNudgeInput): boolean => {
  const since = dismissedAt === null || dismissedAt > records ? 0 : dismissedAt;
  return records - since >= GUEST_NUDGE_THRESHOLD;
};
