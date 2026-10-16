import { countUserRecords } from "@alrisali/db-user/shared";
import { shouldNudgeGuest } from "@alrisali/domain/account";
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";

import { authClient } from "@/shared/lib/auth-client";
import { deviceEntry } from "@/shared/lib/device-entries";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

// The record count at the Guest's last dismissal. Kept on the device: it is
// about this install's reminder, not the Believer's records.
const DISMISSED_AT_KEY = deviceEntry("alrisali.account.guestNudgeDismissedAt");

const GUEST_RECORDS_QUERY_KEY = [...USER_DATA_QUERY_KEY, "guest-records"];

const readDismissedAt = (): number | null => {
  const stored = Number(SecureStore.getItem(DISMISSED_AT_KEY) ?? Number.NaN);
  return Number.isInteger(stored) ? stored : null;
};

export interface GuestNudge {
  shown: boolean;
  /** Records only on this device. */
  records: number;
  dismiss: () => void;
}

/**
 * Whether to tell a Guest how many records are only on this device. The
 * count is read from the database whenever a screen showing it opens, so
 * it follows what the Guest recorded, never a timer.
 */
export const useGuestNudge = (): GuestNudge => {
  const { data: session, isPending } = authClient.useSession();
  const guest = !(isPending || session);
  const [dismissedAt, setDismissedAt] = useState(readDismissedAt);
  const { data: records } = useQuery({
    queryKey: GUEST_RECORDS_QUERY_KEY,
    queryFn: async () => {
      const { db } = await getUserDatabase();
      return countUserRecords(db);
    },
    enabled: guest,
  });

  return {
    shown:
      guest &&
      records !== undefined &&
      shouldNudgeGuest({ records, dismissedAt }),
    records: records ?? 0,
    dismiss: () => {
      if (records !== undefined) {
        SecureStore.setItem(DISMISSED_AT_KEY, String(records));
        setDismissedAt(records);
      }
    },
  };
};
