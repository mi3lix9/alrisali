// Arabic speech recognition on the device: checks whether Arabic can be heard
// (on the device or over the network) and runs a continuous listening session
// with interim results that restarts itself, because iOS ends sessions after
// silence or one final result even when `continuous` is set.

import { requireOptionalNativeModule } from "expo";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";

import {
  ARABIC_LOCALE,
  isGlitch,
  sessionFailure,
  supportFromLocales,
  supportFromProbe,
} from "./speech-support";
import type {
  SpeechProbeResult,
  SpeechSupport,
  SpeechUnavailableReason,
} from "./speech-support";

export type { SpeechSupport, SpeechUnavailableReason } from "./speech-support";

/** Google's on-device recognition service on Android. */
const ANDROID_ON_DEVICE_SERVICE = "com.google.android.as";

/** Pause before listening again; grows with each glitch in a row. */
const RESTART_DELAY_MS = 250;

/** The per-locale probe (modules/speech-probe); the library's ignores locale. */
const speechProbe = requireOptionalNativeModule<{
  probe: (locale: string) => SpeechProbeResult;
}>("SpeechProbe");

const supportedLocales = async (service?: string) => {
  try {
    return await ExpoSpeechRecognitionModule.getSupportedLocales(
      service ? { androidRecognitionServicePackage: service } : {}
    );
  } catch {
    // The service is missing: it holds no locales.
    return { locales: [], installedLocales: [] };
  }
};

const platformSupport = async (): Promise<SpeechSupport> => {
  if (Platform.OS === "ios" && speechProbe) {
    return supportFromProbe(speechProbe.probe(ARABIC_LOCALE));
  }
  const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
  if (Platform.OS === "android") {
    const [service, onDevice] = await Promise.all([
      supportedLocales(),
      supportedLocales(ANDROID_ON_DEVICE_SERVICE),
    ]);
    return supportFromLocales({
      available,
      locales: service.locales,
      installed: onDevice.installedLocales,
    });
  }
  // Without the probe the library cannot tell whether Arabic runs on the
  // device, so assume the network.
  return available
    ? { usable: true, onDevice: false, locale: ARABIC_LOCALE }
    : { usable: false, reason: "no-recognizer" };
};

/**
 * Whether Arabic speech can be recognised here, asking the Believer for
 * microphone and speech access when it can.
 */
export const checkArabicSpeech = async (): Promise<SpeechSupport> => {
  const support = await platformSupport();
  if (!support.usable) {
    return support;
  }
  const permission =
    await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) {
    return {
      usable: false,
      reason: permission.restricted ? "restricted" : "denied",
    };
  }
  return support;
};

const subscribeAppState = (onChange: () => void) => {
  const subscription = AppState.addEventListener("change", onChange);
  return () => subscription.remove();
};

export interface SpeechSessionOptions {
  /** Where to listen, from a usable `checkArabicSpeech`; null: don't listen. */
  engine: { onDevice: boolean; locale: string } | null;
  /** Every interim and final transcript of the current utterance. */
  onTranscript: (transcript: string, isFinal: boolean) => void;
  /** A session ended: the next transcript starts a new utterance. */
  onSessionEnd: () => void;
  /** Listening stopped for good. */
  onUnavailable: (reason: SpeechUnavailableReason) => void;
}

/**
 * Listens while `engine` is set and the app is in the foreground: the
 * microphone is never used in the background.
 */
export const useSpeechSession = ({
  engine,
  onTranscript,
  onSessionEnd,
  onUnavailable,
}: SpeechSessionOptions) => {
  const foreground = useSyncExternalStore(
    subscribeAppState,
    () => AppState.currentState === "active"
  );
  const heard = useEffectEvent(onTranscript);
  const ended = useEffectEvent(onSessionEnd);
  const failed = useEffectEvent(onUnavailable);
  const onDevice = engine?.onDevice;
  const locale = engine?.locale;

  useEffect(() => {
    if (!foreground || locale === undefined || onDevice === undefined) {
      return;
    }
    let stopped = false;
    let failedRuns = 0;
    let restart: number | undefined;

    const start = () => {
      ExpoSpeechRecognitionModule.start({
        lang: locale,
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: onDevice,
        addsPunctuation: false,
        iosTaskHint: "dictation",
        ...(Platform.OS === "android" && onDevice
          ? { androidRecognitionServicePackage: ANDROID_ON_DEVICE_SERVICE }
          : {}),
      });
    };

    const subscriptions = [
      ExpoSpeechRecognitionModule.addListener("result", (event) => {
        failedRuns = 0;
        const transcript = event.results[0]?.transcript;
        if (transcript) {
          heard(transcript, event.isFinal);
        }
      }),
      ExpoSpeechRecognitionModule.addListener("error", (event) => {
        if (isGlitch(event.error)) {
          failedRuns += 1;
        }
        const reason = sessionFailure(event.error, failedRuns);
        if (reason) {
          stopped = true;
          failed(reason);
        }
      }),
      // iOS also ends on silence without an error: listen again.
      ExpoSpeechRecognitionModule.addListener("end", () => {
        ended();
        if (!stopped) {
          restart = setTimeout(start, RESTART_DELAY_MS * (failedRuns + 1));
        }
      }),
    ];
    start();

    return () => {
      stopped = true;
      clearTimeout(restart);
      for (const subscription of subscriptions) {
        subscription.remove();
      }
      ExpoSpeechRecognitionModule.abort();
    };
  }, [foreground, locale, onDevice]);
};
