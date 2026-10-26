import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  names: {
    imsak: "Imsak",
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  },
  minutes: {
    zero: "{{count}} minutes",
    one: "1 minute",
    two: "{{count}} minutes",
    few: "{{count}} minutes",
    many: "{{count}} minutes",
    other: "{{count}} minutes",
  },
  notification: {
    salahBefore: "{{name}} in {{minutes}}",
    salahNow: "It's time for {{name}}",
    imsakBefore: "Imsak in {{minutes}}",
    imsakNow: "It's Imsak: the fast begins",
    saying: "{{text}}\n— {{source}}",
    habit: {
      classic:
        "“The deeds most beloved to Allah are those a servant keeps up, even if small.”\n— Imam al-Sadiq (a), al-Kafi",
      modern: "A small step today keeps your Habit going. It's time.",
    },
    modern: {
      fajr: "A fresh start is waiting. Begin your morning with Allah.",
      dhuhr: "Take a short pause from your day and reconnect with Allah.",
      asr: "Before the day slips away, give yourself a few calm minutes.",
      maghrib:
        "The day is done. Close it with a prayer that settles the heart.",
      isha: "End your day gently and leave your worries with Allah.",
      imsak:
        "Finish your suhoor and renew your intention. May your fast be accepted.",
    },
  },
  screen: {
    intro:
      "Reminders come from your device itself, even offline, on your location's Prayer Times and your device's time zone.",
    noLocation: "Set your location in Settings to get Salah Reminders.",
    denied:
      "Notifications are off for this app, so no Reminders can arrive. Allow them in the device's settings.",
    openSettings: "Open device settings",
    allow: "Allow notifications",
    exactAlarms:
      "Android may deliver Reminders minutes late unless the app may set alarms on time.",
    allowExactAlarms: "Allow on-time alarms",
    salahTitle: "Salah Reminders",
    imsakTitle: "Imsak Reminder",
    imsakDescription:
      "Arrives at Imsak, so you don't miss the start of the fast.",
  },
  bell: {
    label: "{{name}}: {{state}}",
    off: "Reminder off",
    tone: "Reminder on",
    silent: "Reminder silent",
    adhan: "Reminder with the Adhan voice",
  },
  rule: {
    sound: "Sound",
    adhan: "Adhan",
    minutesBefore: "Minutes before",
    adhanOption: "{{muezzin}}: {{form}}",
    adhanForms: {
      takbeer: "Takbeer only",
      full: "Full Adhan",
    },
    muezzins: {
      hatamzadeh: "Saeed Hatamzadeh-Varmazyar",
      sobhdel: "Hussein Sobhdel",
    },
    adhanIosHint:
      "On iPhone only the takbeer plays, even if you choose the full Adhan: iOS limits a notification sound to thirty seconds.",
    sounds: {
      default: "System sound",
      chime: "Chime",
      bell: "Bell",
    },
  },
  alertType: {
    title: "Alert",
    types: {
      off: "Off",
      silent: "Silent",
      tone: "Tone",
      adhan: "Adhan",
    },
    hints: {
      off: "No Reminder for this time.",
      silent: "Shows the Reminder without a sound.",
      tone: "A short tone with the notification.",
      adhan: "Plays the Adhan instead of the tone.",
    },
  },
  sheet: {
    back: "Back",
    willHear: "You'll get",
    timing: "Timing",
    onTime: "On time",
    beforeShort: "{{minutes}} before",
    preview: "Preview {{sound}}",
    stopPreview: "Stop {{sound}}",
  },
  summary: {
    off: "No Reminder for {{name}}.",
    silent: "Silent notification",
    tone: "{{sound}}",
    toneDefault: "System sound",
    adhanFull: "{{muezzin}}'s full Adhan",
    adhanTakbeer: "{{muezzin}}'s takbeer",
    before: "{{minutes}} before {{name}}",
    at: "when {{name}} begins",
    line: "{{sound}} {{timing}}",
  },
  quietHours: {
    title: "Quiet hours",
    description:
      "Non-essential Reminders are held back. Salah and Imsak Reminders always arrive.",
    enabled: "Use quiet hours",
    start: "From",
    end: "To",
  },
};
