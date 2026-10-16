import { formatNumber as formatShared } from "@/shared/lib/numbers";

/** A number in the interface's digits, at most one decimal. */
export const formatNumber = (value: number): string =>
  formatShared(value, { maximumFractionDigits: 1 });

/** A 0–1 share as a whole percentage. */
export const formatPercent = (share: number): string =>
  formatShared(share, { style: "percent" });

/** Whether `key` names one of `labels`: synced data may hold newer keys. */
export const isLabelled = <Labels extends object>(
  labels: Labels,
  key: string
): key is Extract<keyof Labels, string> => Object.keys(labels).includes(key);
