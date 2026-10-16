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
 * The Khatmah the Believer is reading: the newest not yet finished one.
 * Undefined while it loads, null when there is none.
 */
export const useActiveKhatmah = (): ActiveKhatmah | null | undefined => {
  const { data } = useKhatmahData();
  const today = useToday();
  if (!data) {
    return;
  }
  const { khatmahs, logs } = data;
  for (const khatmah of khatmahs.toReversed()) {
    const status = khatmahStatus(khatmah, logs, today);
    if (status.state !== "finished") {
      return { khatmah, logs, status };
    }
  }
  return null;
};
