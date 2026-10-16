/** Today's visible Prayer Times, worded and timed for another feature to share. */
export interface SharedTimes {
  title: string;
  subtitle: string;
  rows: { label: string; time: string }[];
  footer: string | null;
}
