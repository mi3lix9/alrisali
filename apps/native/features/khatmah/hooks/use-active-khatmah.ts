import { khatmahStatus } from "@alrisali/domain/khatmah";
import type {
  Khatmah,
  KhatmahLog,
  KhatmahStatus,
} from "@alrisali/domain/khatmah";

import { useToday } from "@/shared/lib/today";

import { useKhatmahData } from "../data/khatmah";

export interface ActiveKhatmah {
  khatmah: Khatmah;
  logs: KhatmahLog[];
  status: KhatmahStatus;
}

/**
 * The Khatmah the Believer is reading: the newest not yet finished one, or
 * the one a Link names by `id` when it exists (else as without one). Undefined while it loads, null
 * when there is none.
 */
export const useActiveKhatmah = (
  id?: string
): ActiveKhatmah | null | undefined => {
  const { data } = useKhatmahData();
  const today = useToday();
  if (!data) {
    return;
  }
  const { khatmahs, logs } = data;
  const named = khatmahs.find((khatmah) => khatmah.id === id);
  const shown =
    named ??
    khatmahs
      .toReversed()
      .find(
        (khatmah) => khatmahStatus(khatmah, logs, today).state !== "finished"
      );
  return shown
    ? { khatmah: shown, logs, status: khatmahStatus(shown, logs, today) }
    : null;
};
