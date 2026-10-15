import { classicSayingById } from "@alrisali/domain/reminders";
import type {
  HabitReminderMessage,
  PlannedReminder,
  PrayerReminderMessage,
  ReminderAlert,
} from "@alrisali/domain/reminders";
import type { Language } from "@alrisali/i18n";
import type { TFunction } from "i18next";

/** Where each alert's sound comes from; the files are in assets/sounds. */
const SOUND_FILES = {
  chime: "chime.wav",
  bell: "bell.wav",
  voice: "adhan.wav",
} as const;

/**
 * One Android channel per alert: Android fixes a channel's sound when the
 * channel is created, so each sound gets its own.
 */
export const REMINDER_CHANNELS = [
  { id: "reminder-default", sound: "default" },
  { id: "reminder-chime", sound: SOUND_FILES.chime },
  { id: "reminder-bell", sound: SOUND_FILES.bell },
  { id: "reminder-voice", sound: SOUND_FILES.voice },
  { id: "reminder-silent", sound: null },
] as const;

type ChannelId = (typeof REMINDER_CHANNELS)[number]["id"];

const alertSound = (
  alert: ReminderAlert
): { channelId: ChannelId; sound: string | null } => {
  switch (alert.kind) {
    case "silent": {
      return { channelId: "reminder-silent", sound: null };
    }
    case "voice": {
      return { channelId: "reminder-voice", sound: SOUND_FILES.voice };
    }
    default: {
      return alert.sound === "default"
        ? { channelId: "reminder-default", sound: "default" }
        : {
            channelId: `reminder-${alert.sound}`,
            sound: SOUND_FILES[alert.sound],
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
  channelId: ChannelId;
  sound: string | null;
}

const minutesPhrase = (
  t: TFunction<"reminders">,
  language: Language,
  count: number
): string => {
  const form = new Intl.PluralRules(language).select(count);
  return t(`minutes.${form}`, {
    count: new Intl.NumberFormat(language).format(count),
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

/** The Reminder worded in the launch language and its Message Style. */
export const toReminderRequest = (
  reminder: PlannedReminder<PrayerReminderMessage | HabitReminderMessage>,
  t: TFunction<"reminders">,
  language: Language
): ReminderRequest => {
  const { message } = reminder;
  const { title, body } =
    message.kind === "habit"
      ? {
          title: message.name,
          body: t(`notification.habit.${message.style}`),
        }
      : prayerTimeWording(message, t, language);
  const fireAt = reminder.fireAt.epochMilliseconds;
  const { channelId, sound } = alertSound(reminder.alert);
  return {
    id: reminder.id,
    fingerprint: JSON.stringify([fireAt, title, body, channelId, sound]),
    fireAt,
    title,
    body,
    channelId,
    sound,
  };
};
