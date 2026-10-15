import { launchLanguage } from "@/shared/lib/preferences";

const numbers = new Intl.NumberFormat(launchLanguage, {
  maximumFractionDigits: 1,
});
const percents = new Intl.NumberFormat(launchLanguage, { style: "percent" });

/** A number in the app language's digits, at most one decimal. */
export const formatNumber = (value: number): string => numbers.format(value);

/** A 0–1 share as a whole percentage. */
export const formatPercent = (share: number): string => percents.format(share);

/** Whether `key` names one of `labels`: synced data may hold newer keys. */
export const isLabelled = <Labels extends object>(
  labels: Labels,
  key: string
): key is Extract<keyof Labels, string> => Object.keys(labels).includes(key);
