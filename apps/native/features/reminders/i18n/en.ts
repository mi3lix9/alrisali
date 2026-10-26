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
    qada: {
      title: "Qada",
      body: "Today's plan: {{n}} Qada Salah.",
    },
    khatmah: {
      title: "Khatmah",
      body: "Today's portion: from {{from}} to {{to}}.",
    },
    occasion: {
      dayOf: "Today: {{name}}",
      eveningBefore: "Tomorrow: {{name}}",
      body: "The night of the Occasion begins at Maghrib.",
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
    nightDua: {
      kumayl: {
        title: "Dua Kumayl",
        body: "Thursday night: time to recite Dua Kumayl.",
      },
      tawassul: {
        title: "Dua Tawassul",
        body: "Time to recite Dua Tawassul.",
      },
      nudba: {
        title: "Dua Nudba",
        body: "Friday morning: time to recite Dua Nudba.",
      },
      ziyarah: {
        title: "Today's ziyarah",
        body: "{{names}}",
      },
    },
  },
  adhanService: {
    stop: "Stop adhan",
    channel: "Adhan",
    title: "Full adhan on Android",
    description:
      "The full adhan plays at its time even with the screen off, and you can stop it from the notification.",
    stream: "Sound channel",
    streamAlarm: "Alarm",
    streamAlarmHint:
      "At the alarm volume, and it sounds even if the phone is on silent.",
    streamMedia: "Media",
    streamMediaHint:
      "At the media volume, like a recitation. Android lowers it in Do Not Disturb.",
    playDuringDnd: "Play the adhan in Do Not Disturb",
    playDuringDndHint:
      "Android lets alarm sounds through Do Not Disturb, so the adhan plays on the alarm channel whichever you chose above. When this is off, you get a silent notification while Do Not Disturb is on.",
    fullScreen: "Full-screen adhan",
    fullScreenHint:
      "A screen with a Stop button opens over the lock screen when the adhan starts.",
    fullScreenDenied:
      "Android has turned off the full-screen permission for this app, so you get an ordinary notification. Allow it in settings.",
    openFullScreenSettings: "Open full-screen settings",
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
  health: {
    title: "Alert Health",
    description: "Check what could stop alerts arriving on time, and fix it.",
    open: "Check alerts",
    allGood: "Everything is ready",
    needsAttention: "Some checks need your attention",
    banner: {
      title: "Your alerts may not arrive on time",
      fix: "Fix now",
    },
    status: { ok: "Ready", failing: "Needs a fix" },
    checks: {
      notifications: {
        title: "Notification permission",
        ok: "Allowed",
        failing: "Notifications are not allowed, so alerts won't arrive.",
        fix: "Allow",
      },
      sound: {
        title: "Sounds",
        ok: "On for the app's notifications",
        failing:
          "Notification sound is off for this app, so the adhan won't be heard.",
        fix: "Open settings",
      },
      exactAlarms: {
        title: "Exact alarms",
        ok: "Alerts arrive in the same minute",
        failing: "Android may delay alerts by minutes.",
        fix: "Allow",
      },
      batteryOptimisation: {
        title: "Battery optimisation",
        ok: "The app is exempt",
        failing:
          "Battery optimisation is on for this app and may delay the Fajr adhan.",
        fix: "Open settings",
      },
      autostart: {
        title: "Autostart",
        ok: "You allowed it",
        failing:
          "Your phone ({{maker}}) needs autostart allowed so alerts are scheduled again after a restart. The app can't read it, so confirm once you've allowed it.",
        fix: "Open settings",
        confirm: "I allowed it",
        undo: "Undo",
      },
    },
    test: {
      button: "Send a test alert",
      hint: "A notification arrives in a few seconds, to confirm the fix worked.",
      sent: "The notification is on its way.",
      denied: "Notifications are not allowed. Allow them first.",
      title: "Test alert",
      body: "Your alerts are arriving.",
    },
  },
  quietHours: {
    title: "Quiet hours",
    description:
      "Reminders before a Salah and other non-essential alerts are held back. At-Time Alerts and Imsak always arrive.",
    enabled: "Use quiet hours",
    start: "From",
    end: "To",
  },
  occasionAlerts: {
    title: "Occasion alerts",
    description: "Be alerted to Occasions on the day or on the evening before.",
    enabled: "Alert me to Occasions",
    timing: "When",
    timings: {
      "day-of": "On the day",
      "evening-before": "The evening before (after Maghrib)",
    },
    eveningHint:
      "The alert arrives at your chosen time, or at Maghrib if that is later. It needs your location.",
    time: "Time",
    types: "Types",
    typeNames: {
      celebration: "Celebration",
      mourning: "Mourning",
      religious: "Religious day",
      fasting: "Fast",
    },
  },
  nightDua: {
    title: "Night duas and ziyarah",
    description:
      "Optional alerts, each its own switch and off by default. Quiet hours hold them back.",
    kumayl: "Dua Kumayl",
    kumaylHint: "Thursday night, after Maghrib",
    tawassul: "Dua Tawassul",
    tawassulHint:
      "Tuesday night, after Maghrib. The dua's text is not in the app yet.",
    nudba: "Dua Nudba",
    nudbaHint: "Friday morning, at sunrise",
    ziyarah: "Ziyarah of the day",
    ziyarahHint: "Each morning at sunrise, by that weekday's ziyarah",
    noLocation: "Set your location so Maghrib and sunrise can be worked out.",
  },
  atTime: {
    off: { title: "Off", description: "Nothing at the Prayer Time" },
    silent: {
      title: "Silent notification",
      description: "A notification without sound",
    },
    takbir: {
      title: "Short takbir",
      description: "A short “Allahu akbar” with the notification",
    },
    adhan: {
      title: "Full adhan",
      description: "The whole adhan at the Prayer Time",
    },
  },
  editor: {
    adhanUnavailable:
      "Download an adhan voice on the Adhan voice page to make the full adhan available offline.",
    adhanOnOpen: "The full adhan plays when you open the notification",
    systemSound: "Your device's notification sound",
    systemSoundHint:
      "No adhan voices are published yet, so your device's notification sound plays.",
    voiceNotDownloaded: "Download the voice to choose it ({{size}})",
    voiceDownloaded: "Downloaded · {{size}}",
    voiceProgress: "{{done}} of {{total}}",
    voiceDownload: "Download {{name}}",
    voicePause: "Pause downloading {{name}}",
    voiceResume: "Resume downloading {{name}}",
    voiceStatus: {
      paused: "Paused",
      "waiting-for-wifi": "Waiting for Wi-Fi",
      offline: "No connection",
      failed: "Download failed",
    },
    takbirFromVoice: "The short takbir is a cut of the chosen voice.",
    beforeHint: "Separate from the At-Time Alert.",
    minutesBefore: "Minutes before",
    ramadanOnly: "Only in Ramadan",
    ramadanOnlyHint: "The Imsak alert comes on the days of Ramadan alone.",
    iosLimit:
      "iOS plays at most {{seconds}} seconds of a notification sound: you hear the short takbir with the notification, and the full adhan plays when you open it.",
    testNotification: "Test: {{name}} alert",
    testDenied: "Allow notifications to hear the notification sound.",
    permissionTitle: "Notifications are needed",
    permissionReason:
      "Alerts arrive as notifications from your device. Changing an alert or playing its sound asks to allow them.",
  },
  tones: {
    default: {
      title: "System sound",
      hint: "Your device's notification sound",
    },
    chime: { title: "Chime", hint: "A soft chime" },
    bell: { title: "Bell", hint: "A bell" },
    voice: { title: "Adhan voice", hint: "A short takbir instead of a tone" },
    silent: { title: "Silent", hint: "Shows the Reminder without a sound" },
  },
  sheet: {
    back: "Back",
    atTime: "At the Prayer Time",
    voice: "Adhan voice",
    before: "Reminder before",
    off: "Off",
    beforeValue: "{{minutes}} before",
    onTime: "At the Prayer Time",
    preview: "Play {{sound}}",
    stopPreview: "Stop {{sound}}",
  },
  summary: {
    atTime: {
      off: "Nothing at {{name}}",
      silent: "A silent notification at {{name}}",
      takbirSystem: "Your device's notification sound at {{name}}",
      takbir: "{{voice}}'s takbir at {{name}}",
      adhan: "{{voice}}'s full adhan at {{name}}",
    },
    before: {
      off: "No reminder before",
      at: "{{tone}} when it begins",
      on: "{{tone}}, {{minutes}} before",
    },
  },
  storage: {
    title: "Downloaded adhans",
    description: "Adhan voices downloaded to this device, to play offline.",
    empty: "No adhan downloaded. Download a voice from any prayer's alert.",
    delete: "Delete",
  },
  onboarding: {
    previewLabel: "What an alert looks like",
    previewApp: "Al-Risali",
    previewNow: "now",
    enableAll: "Takbir at every Salah",
    enableAllHint: "Turn the At-Time Alert on for all five Salah, or off.",
    sectionTitle: "At the Prayer Time",
    skipHint: "Skipping keeps the suggested choices.",
  },
  button: {
    label: "{{name}} At-Time Alert: {{alert}}",
  },
};
