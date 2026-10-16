import { atTimeSound, classicSayingById } from "@alrisali/domain/reminders";
import type {
  HabitReminderMessage,
  PlannedReminder,
  PrayerReminderMessage,
  QadaReminderMessage,
  ReminderAlert,
} from "@alrisali/domain/reminders";
import type { Language } from "@alrisali/i18n";
import type { TFunction } from "i18next";
import { Platform } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";

import { INSTALLED_ADHAN_SOUNDS } from "../data/adhan-catalogue";

/** Where each alert's sound comes from; the files are in assets/sounds. */
const SOUND_FILES = {
  chime: "chime.wav",
  bell: "bell.wav",
  voice: "adhan.wav",
} as const;

/** The channel of an At-Time Alert that plays the system's sound. */
export const AT_TIME_SYSTEM_CHANNEL = "at-time-default";

const atTimeChannel = (file: string) => `at-time-${file}`;

/**
 * One Android channel per alert: Android fixes a channel's sound when the
 * channel is created, so each sound gets its own. At-Time Alerts have their
 * own channels, so the Believer can tune them apart from the Reminders.
 */
export const REMINDER_CHANNELS: readonly {
  id: string;
  sound: string | null;
}[] = [
  { id: "reminder-default", sound: "default" },
  { id: "reminder-chime", sound: SOUND_FILES.chime },
  { id: "reminder-bell", sound: SOUND_FILES.bell },
  { id: "reminder-voice", sound: SOUND_FILES.voice },
  { id: "reminder-silent", sound: null },
  { id: AT_TIME_SYSTEM_CHANNEL, sound: "default" },
  ...INSTALLED_ADHAN_SOUNDS.flatMap(({ full, takbir }) =>
    [full.file, takbir.file].map((file) => ({
      id: atTimeChannel(file),
      sound: file,
    }))
  ),
];

interface AlertSound {
  channelId: string;
  sound: string | null;
  /** The full adhan to play in the app when the notification is opened. */
  adhanOnOpen: string | null;
}

/**
 * The takbir and the full adhan from the installed voice, else the system
 * sound. iOS plays at most 30 seconds of a notification sound: it sounds the
 * takbir and plays the full adhan when opened. Android sounds the full adhan
 * itself, until its adhan service (ticket 30).
 */
const atTimeAlertSound = (alert: ReminderAlert): AlertSound => {
  const { notification, full } = atTimeSound(alert, INSTALLED_ADHAN_SOUNDS);
  const played =
    Platform.OS === "android" ? (full ?? notification) : notification;
  return {
    channelId: played ? atTimeChannel(played.file) : AT_TIME_SYSTEM_CHANNEL,
    sound: played?.file ?? "default",
    adhanOnOpen: Platform.OS === "ios" ? (full?.file ?? null) : null,
  };
};

const alertSound = (alert: ReminderAlert): AlertSound => {
  switch (alert.kind) {
    case "silent": {
      return { channelId: "reminder-silent", sound: null, adhanOnOpen: null };
    }
    case "voice": {
      return {
        channelId: "reminder-voice",
        sound: SOUND_FILES.voice,
        adhanOnOpen: null,
      };
    }
    case "takbir":
    case "adhan": {
      return atTimeAlertSound(alert);
    }
    default: {
      return alert.sound === "default"
        ? { channelId: "reminder-default", sound: "default", adhanOnOpen: null }
        : {
            channelId: `reminder-${alert.sound}`,
            sound: SOUND_FILES[alert.sound],
            adhanOnOpen: null,
          };
    }
  }
};

/** A Reminder as the device schedules it. */
export interface ReminderRequest {
  id: string;
  /** Changes whenever anything the Believer would notice changes. */
  fingerprint: string;
  fireAt: number;
  title: string;
  body: string;
  channelId: string;
  sound: string | null;
  /** The full adhan to play when the notification is opened (iOS). */
  adhanOnOpen: string | null;
}

const minutesPhrase = (
  t: TFunction<"reminders">,
  language: Language,
  count: number
): string => {
  const form = new Intl.PluralRules(language).select(count);
  return t(`minutes.${form}`, {
    count: formatNumber(count),
  });
};

/** A Prayer Time Reminder's title and body. */
const prayerTimeWording = (
  message: PrayerReminderMessage,
  t: TFunction<"reminders">,
  language: Language
): { title: string; body: string } => {
  const { prayerTime, minutesBefore } = message;
  const name = t(`names.${prayerTime}`);
  const minutes = minutesPhrase(t, language, minutesBefore);
  let title: string;
  if (prayerTime === "imsak") {
    title =
      minutesBefore > 0
        ? t("notification.imsakBefore", { minutes })
        : t("notification.imsakNow");
  } else {
    title =
      minutesBefore > 0
        ? t("notification.salahBefore", { name, minutes })
        : t("notification.salahNow", { name });
  }
  const saying = message.sayingId
    ? classicSayingById(message.sayingId)
    : undefined;
  const body =
    message.style === "classic" && saying
      ? t("notification.saying", {
          text: saying.text[language],
          source: saying.source[language],
        })
      : t(`notification.modern.${prayerTime}`);
  return { title, body };
};

/** A Reminder's title and body, by what it reminds of. */
const wording = (
  message: PrayerReminderMessage | HabitReminderMessage | QadaReminderMessage,
  t: TFunction<"reminders">,
  language: Language
): { title: string; body: string } => {
  switch (message.kind) {
    case "habit": {
      return {
        title: message.name,
        body: t(`notification.habit.${message.style}`),
      };
    }
    case "qada": {
      return {
        title: t("notification.qada.title"),
        body: t("notification.qada.body", {
          n: formatNumber(message.salahPerDay),
        }),
      };
    }
    default: {
      return prayerTimeWording(message, t, language);
    }
  }
};

/** The Reminder worded in the launch language and its Message Style. */
export const toReminderRequest = (
  reminder: PlannedReminder<
    PrayerReminderMessage | HabitReminderMessage | QadaReminderMessage
  >,
  t: TFunction<"reminders">,
  language: Language
): ReminderRequest => {
  const { title, body } = wording(reminder.message, t, language);
  const fireAt = reminder.fireAt.epochMilliseconds;
  const { channelId, sound, adhanOnOpen } = alertSound(reminder.alert);
  return {
    id: reminder.id,
    fingerprint: JSON.stringify([
      fireAt,
      title,
      body,
      channelId,
      sound,
      adhanOnOpen,
    ]),
    fireAt,
    title,
    body,
    channelId,
    sound,
    adhanOnOpen,
  };
};
