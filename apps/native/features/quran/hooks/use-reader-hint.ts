import * as SecureStore from "expo-secure-store";
import { useState } from "react";

import { deviceEntry } from "@/shared/lib/device-entries";

const HINT_SEEN_KEY = deviceEntry("alrisali.quran.hintSeen");

/**
 * The one-time hint on the reader's first open (tap for the controls,
 * long-press an ayah for its options). Kept on the device: it is about this
 * install, not the Believer's records.
 */
export const useReaderHint = (): { shown: boolean; dismiss: () => void } => {
  const [shown, setShown] = useState(
    () => SecureStore.getItem(HINT_SEEN_KEY) === null
  );
  return {
    shown,
    dismiss: () => {
      if (shown) {
        SecureStore.setItem(HINT_SEEN_KEY, "1");
        setShown(false);
      }
    },
  };
};
