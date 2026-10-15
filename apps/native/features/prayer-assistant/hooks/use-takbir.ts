import { createTakbirDetector } from "@alrisali/domain/prayer-assistant";
import type { Sighting } from "@alrisali/domain/prayer-assistant";
import { useEffect, useMemo, useState } from "react";

import {
  checkArabicSpeech,
  useSpeechSession,
} from "@/shared/lib/speech/speech-recognition";
import type { SpeechSupport } from "@/shared/lib/speech/speech-recognition";

export interface TakbirListening {
  /** Null while checking; unusable means tap mode carries the Salah. */
  support: SpeechSupport | null;
  /** Whether the opening Takbir has been heard. */
  opened: boolean;
  /** Checks again, after the Believer fixed what stopped it. */
  retry: () => void;
}

/** Checks Arabic speech and hands the answer to `apply`. */
const checkInto = async (apply: (support: SpeechSupport) => void) => {
  try {
    apply(await checkArabicSpeech());
  } catch {
    apply({ usable: false, reason: "failing" });
  }
};

/**
 * Sound mode: listens while praying and moves one step per Takbir heard,
 * after the opening one. Taps keep working, so when speech is unavailable
 * the Salah goes on by tap.
 */
export const useTakbir = ({
  underWay,
  send,
}: {
  /** The Salah has moved past its first step (a tap moved it). */
  underWay: boolean;
  send: (sighting: Sighting) => void;
}): TakbirListening => {
  const detector = useMemo(() => createTakbirDetector(), []);
  const [support, setSupport] = useState<SpeechSupport | null>(null);
  const [heardOpening, setHeardOpening] = useState(false);

  useEffect(() => {
    let current = true;
    void checkInto((checked) => {
      if (current) {
        setSupport(checked);
      }
    });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    if (underWay) {
      detector.open();
    }
  }, [underWay, detector]);

  useSpeechSession({
    engine: support?.usable ? support : null,
    onTranscript: (transcript, isFinal) => {
      const steps = detector.feed(transcript, isFinal, performance.now());
      setHeardOpening(detector.opened);
      for (let step = 0; step < steps; step += 1) {
        send({ kind: "advance" });
      }
    },
    onSessionEnd: () => detector.seal(),
    onUnavailable: (reason) => setSupport({ usable: false, reason }),
  });

  return {
    support,
    opened: heardOpening || underWay,
    retry: () => {
      setSupport(null);
      void checkInto(setSupport);
    },
  };
};
