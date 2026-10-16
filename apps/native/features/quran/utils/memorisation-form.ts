import { REPEAT_COUNTS, SLEEP_TIMERS } from "@alrisali/domain/quran";
import type {
  PauseAfterAyah,
  PlaybackSettings,
  RepeatCount,
  SleepTimer,
} from "@alrisali/domain/quran";

// The Play To form's memorisation choices as the form holds them (every
// choice an id string, as its toggle groups need), and as the domain's
// playback settings.

export interface MemorisationForm {
  ayahRepeat: string;
  rangeRepeat: string;
  pause: "none" | "seconds" | "ayahLength";
  seconds: string;
  factor: string;
  speed: string;
  sleep: string;
  askToContinueAtEnd: boolean;
}

export const PAUSE_SECONDS = [1, 2, 3, 5, 10] as const;

export const DEFAULT_MEMORISATION_FORM: MemorisationForm = {
  ayahRepeat: "1",
  rangeRepeat: "1",
  pause: "none",
  seconds: "3",
  factor: "1",
  speed: "1",
  sleep: "off",
  askToContinueAtEnd: true,
};

export const repeatId: (count: RepeatCount) => string = String;

export const sleepId = (sleep: SleepTimer): string =>
  sleep.kind === "minutes" ? `minutes-${sleep.minutes}` : sleep.kind;

const repeatOf = (id: string): RepeatCount =>
  REPEAT_COUNTS.find((count) => repeatId(count) === id) ?? 1;

const sleepOf = (id: string): SleepTimer =>
  SLEEP_TIMERS.find((sleep) => sleepId(sleep) === id) ?? { kind: "off" };

const pauseOf = ({
  pause,
  seconds,
  factor,
}: MemorisationForm): PauseAfterAyah => {
  if (pause === "seconds") {
    return { kind: "seconds", seconds: Number(seconds) };
  }
  if (pause === "ayahLength") {
    const multiple = Number(factor);
    if (multiple === 0.5 || multiple === 1.5 || multiple === 2) {
      return { kind: "ayahLength", factor: multiple };
    }
    return { kind: "ayahLength", factor: 1 };
  }
  return { kind: "none" };
};

/** What the form asks playback to do. */
export const memorisationSettings = (
  form: MemorisationForm
): PlaybackSettings => ({
  ayahRepeat: repeatOf(form.ayahRepeat),
  rangeRepeat: repeatOf(form.rangeRepeat),
  pause: pauseOf(form),
  speed: Number(form.speed),
  sleep: sleepOf(form.sleep),
  askToContinueAtEnd: form.askToContinueAtEnd,
});
