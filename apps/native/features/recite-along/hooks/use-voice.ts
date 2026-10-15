import {
  createReciteMatcher,
  isListening,
} from "@alrisali/domain/recite-along";
import type {
  ReciteEvent,
  ReciteProgress,
} from "@alrisali/domain/recite-along";
import { useEffect, useMemo, useState } from "react";

import {
  checkArabicSpeech,
  useSpeechSession,
} from "@/shared/lib/speech/speech-recognition";
import type {
  SpeechSupport,
  SpeechUnavailableReason,
} from "@/shared/lib/speech/speech-recognition";

export interface VoiceSupport {
  /** Null while checking, or when the method does not use voice. */
  support: SpeechSupport | null;
  /** Checks again, after the Believer fixed what stopped it. */
  retry: () => void;
  /** Marks speech unusable after listening stopped for good. */
  fail: (reason: SpeechUnavailableReason) => void;
}

/** Checks Arabic speech and hands the answer to `apply`. */
const checkInto = async (apply: (support: SpeechSupport) => void) => {
  try {
    apply(await checkArabicSpeech());
  } catch {
    apply({ usable: false, reason: "failing" });
  }
};

/** Whether Arabic speech works here, checked when a voice method is chosen. */
export const useVoiceSupport = (wanted: boolean): VoiceSupport => {
  const [support, setSupport] = useState<SpeechSupport | null>(null);

  useEffect(() => {
    if (!wanted) {
      return;
    }
    let current = true;
    void checkInto((checked) => {
      if (current) {
        setSupport(checked);
      }
    });
    return () => {
      current = false;
    };
  }, [wanted]);

  return {
    support: wanted ? support : null,
    retry: () => {
      setSupport(null);
      void checkInto(setSupport);
    },
    fail: (reason) => setSupport({ usable: false, reason }),
  };
};

/**
 * Feeds what the Believer recites aloud into the shared progress: voice and
 * touch move one place, so a hold carries the matcher forward and a restart
 * sends it back to the first word.
 */
export const useVoiceFollow = ({
  words,
  progress,
  dispatch,
  voice,
}: {
  words: readonly string[];
  progress: ReciteProgress;
  dispatch: (event: ReciteEvent) => void;
  voice: VoiceSupport;
}) => {
  const matcher = useMemo(() => createReciteMatcher(words), [words]);
  const { count } = progress;

  useEffect(() => {
    // Only touch moves ahead of the matcher, and only a restart moves back.
    if (count > matcher.position || count === 0) {
      matcher.seek(count);
    }
  }, [count, matcher]);

  const { support } = voice;
  useSpeechSession({
    engine: support?.usable && isListening(progress) ? support : null,
    onTranscript: (transcript, isFinal) =>
      dispatch({ type: "heard", count: matcher.feed(transcript, isFinal) }),
    onSessionEnd: () => matcher.seal(),
    onUnavailable: voice.fail,
  });
};
