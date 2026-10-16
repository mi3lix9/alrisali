import { Temporal } from "temporal-polyfill";

/** A day from a link (`2026-10-15`), or null when it holds no valid day. */
export const parseDay = (text?: string): Temporal.PlainDate | null => {
  if (!text) {
    return null;
  }
  try {
    return Temporal.PlainDate.from(text, { overflow: "reject" });
  } catch {
    return null;
  }
};
