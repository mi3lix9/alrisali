// Whether Arabic speech can be recognised on this device, and how: on the
// device when its Arabic model is there, else over the network. Also decides
// which failures end listening for good and which the restart loop rides out.
// Pure, so the platform adapter (./speech-recognition) stays thin.

import type { ExpoSpeechRecognitionErrorCode } from "expo-speech-recognition";

/** Why Arabic speech cannot be used right now. */
export type SpeechUnavailableReason =
  /** No Arabic recogniser on this device. */
  | "no-recognizer"
  /** The recogniser exists but is switched off (Siri & Dictation, no service). */
  | "service-off"
  /** The Believer refused microphone or speech access. */
  | "denied"
  /** Speech recognition is blocked by device restrictions. */
  | "restricted"
  /** Network recognition is needed and the device is offline. */
  | "offline"
  /** Listening kept failing without hearing anything. */
  | "failing";

export type SpeechSupport =
  | { usable: true; onDevice: boolean; locale: string }
  | { usable: false; reason: SpeechUnavailableReason };

/** The Arabic locale asked for when the platform offers no better one. */
export const ARABIC_LOCALE = "ar-SA";

/** iOS answer of the per-locale `SpeechProbe` native module. */
export interface SpeechProbeResult {
  recognizer: boolean;
  isAvailable?: boolean;
  supportsOnDeviceRecognition?: boolean;
}

export const supportFromProbe = (probe: SpeechProbeResult): SpeechSupport => {
  if (!probe.recognizer) {
    return { usable: false, reason: "no-recognizer" };
  }
  if (!probe.isAvailable) {
    return { usable: false, reason: "service-off" };
  }
  return {
    usable: true,
    onDevice: probe.supportsOnDeviceRecognition ?? false,
    locale: ARABIC_LOCALE,
  };
};

const isArabic = (locale: string) => /^ar(?:$|[-_])/u.test(locale);

/**
 * Android answer from the recognition service: `installed` are the locales of
 * the on-device service. Android 12 and below list nothing, so an empty list
 * means "unknown", not "no Arabic".
 */
export const supportFromLocales = ({
  available,
  locales,
  installed,
}: {
  available: boolean;
  locales: readonly string[];
  installed: readonly string[];
}): SpeechSupport => {
  if (!available) {
    return { usable: false, reason: "no-recognizer" };
  }
  const onDevice = installed.find(isArabic);
  if (onDevice) {
    return { usable: true, onDevice: true, locale: onDevice };
  }
  if (locales.length > 0 && !locales.some(isArabic)) {
    return { usable: false, reason: "no-recognizer" };
  }
  return { usable: true, onDevice: false, locale: ARABIC_LOCALE };
};

/** Consecutive failed sessions, with nothing heard, before giving up. */
export const MAX_FAILED_RUNS = 4;

/**
 * What each session error means: a reason listening can never work, a quiet
 * ending (silence, an interruption, our own stop) the loop simply restarts
 * after, or a glitch that counts towards giving up.
 */
const ON_ERROR: Record<
  ExpoSpeechRecognitionErrorCode,
  SpeechUnavailableReason | "quiet" | "glitch"
> = {
  "not-allowed": "denied",
  "language-not-supported": "no-recognizer",
  "service-not-allowed": "service-off",
  network: "offline",
  aborted: "quiet",
  "no-speech": "quiet",
  "speech-timeout": "quiet",
  interrupted: "quiet",
  "audio-capture": "glitch",
  "bad-grammar": "glitch",
  busy: "glitch",
  client: "glitch",
  unknown: "glitch",
};

/** Whether the error counts towards `MAX_FAILED_RUNS`. */
export const isGlitch = (error: ExpoSpeechRecognitionErrorCode): boolean =>
  ON_ERROR[error] === "glitch";

/**
 * Whether a session error ends listening, given how many sessions in a row
 * (this one included) glitched without hearing anything. Null: listen again.
 */
export const sessionFailure = (
  error: ExpoSpeechRecognitionErrorCode,
  failedRuns: number
): SpeechUnavailableReason | null => {
  const outcome = ON_ERROR[error];
  if (outcome === "quiet") {
    return null;
  }
  if (outcome === "glitch") {
    return failedRuns >= MAX_FAILED_RUNS ? "failing" : null;
  }
  return outcome;
};
