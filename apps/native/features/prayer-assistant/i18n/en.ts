import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

// English plurals use only `_one` and `_other`; `_two` and `_few` mirror
// Arabic's forms so the catalogue keeps the same keys.
export const en: Catalog<typeof ar> = {
  title: "Prayer Assistant",
  card: {
    description:
      "Follows you through a Salah and keeps count of your Rak'ahs and Positions.",
    start: "Start",
  },
  setup: {
    salah: "Salah",
    salahRakahs_two: "{{name}} · {{count}} Rak'ahs",
    salahRakahs_few: "{{name}} · {{count}} Rak'ahs",
    salahRakahs_other: "{{name}} · {{count}} Rak'ahs",
    recognitionMode: "Recognition mode",
    recognitionModeDescription:
      "How the assistant knows you moved to the next Position.",
    pace: "Pace",
    paceDescription: "How long the assistant waits in each Position.",
    customHold: "Each Position",
    customTashahhud: "Sitting for Tashahhud",
    seconds: "{{value}} s",
    bowSensitivity: "Bow sensitivity",
    bowSensitivityDescription:
      "Used when the camera senses your Positions: higher accepts a shallower bow.",
    deeper: "Deeper bow",
    shallower: "Shallower bow",
    start: "Start Salah",
    nafila: "With its nafila",
    nafilaDescription:
      "Prayed two Rak'ahs at a time: before Fajr, Dhuhr and Asr, after Maghrib and Isha.",
    otherPrayers: "Other prayers",
    customRakahs: "Rak'ahs",
    rakahs_one: "{{count}} Rak'ah",
    rakahs_two: "{{count}} Rak'ahs",
    rakahs_few: "{{count}} Rak'ahs",
    rakahs_many: "{{count}} Rak'ahs",
    rakahs_other: "{{count}} Rak'ahs",
    summaryPrayers_two: "{{rakahs}} in {{count}} prayers",
    summaryPrayers_few: "{{rakahs}} in {{count}} prayers",
    summaryPrayers_many: "{{rakahs}} in {{count}} prayers",
    summaryPrayers_other: "{{rakahs}} in {{count}} prayers",
  },
  pace: {
    slow: "Slow",
    normal: "Normal",
    fast: "Fast",
    custom: "Custom",
  },
  mode: {
    tap: "Tap",
    camera: "Camera",
    "head-height": "Head height",
    sound: "Sound (Takbir)",
    mat: "Mat",
    proximity: "Proximity sensor",
  },
  salah: {
    fajr: "Fajr",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
    night: "Night prayer",
    ayat: "Ayat prayer",
    ghufayla: "Ghufayla prayer",
    friday: "Friday prayer",
    eid: "Eid prayer",
    ziyarah: "Ziyarah prayer",
    custom: "Custom prayer",
  },
  about: {
    night: "Eight Rak'ahs, then the Shaf' and the Witr",
    ayat: "Two Rak'ahs, with five Ruku in each",
    ghufayla: "Two Rak'ahs between Maghrib and Isha",
    friday: "Two Rak'ahs after the two sermons",
    eid: "Two Rak'ahs; the Eid Takbirs and Qunuts aren't counted",
    ziyarah: "Two Rak'ahs",
    custom: "Any recommended prayer, two Rak'ahs at a time",
  },
  part: {
    nafila: "Nafila",
    shaf: "Shaf'",
    witr: "Witr",
  },
  rakah: {
    first: "First Rak'ah",
    second: "Second Rak'ah",
    third: "Third Rak'ah",
    fourth: "Fourth Rak'ah",
    numbered: "Rak'ah {{value}}",
  },
  position: {
    qiyam: "Qiyam",
    ruku: "Ruku",
    itidal: "I'tidal",
    sujud: "Sujud",
    jalsa: "Jalsa",
    tashahhud: "Tashahhud",
    finalTashahhud: "Final Tashahhud",
  },
  praying: {
    tapHint: "Tap anywhere on the screen as you move to the next Position.",
    tapToAdvance: "Next Position",
    back: "Step back",
    finalHint:
      "Stay seated until you finish the tashahhud and salam, or tap to finish.",
    finish: "I've finished",
    stop: "Stop",
    stopTitle: "Stop the assistant?",
    stopMessage: "This Salah won't be logged.",
    stopCancel: "Keep going",
    stopConfirm: "Stop",
    segmentOf: "{{name}} · {{segment}} of {{segments}}",
    rukuOf: "{{position}} · {{number}} of {{of}}",
    seated: "Prayed seated",
    haste: "Slow down: you reached this Position in under {{value}} seconds.",
  },
  sound: {
    checking: "Getting the microphone ready…",
    sayOpening: "Say “Allahu Akbar” to begin the Salah.",
    listening:
      "Listening for your Takbir: each “Allahu Akbar” moves to the next Position.",
    network:
      "Arabic isn't available offline on this device, so your voice is sent over the internet to be recognised.",
    unavailable: {
      "no-recognizer":
        "Arabic speech recognition isn't available on this device.",
      "service-off":
        "Speech recognition is turned off on this device. Turn on Dictation in Settings.",
      denied:
        "Microphone or speech recognition access isn't allowed. Allow both in Settings to hear your Takbir.",
      restricted: "Speech recognition is restricted on this device.",
      offline:
        "Arabic recognition on this device needs the internet, and the device is offline.",
      failing: "Listening kept stopping without hearing anything.",
    },
    fallback:
      "Carry on by tap: tap the screen as you move to the next Position.",
    retry: "Try again",
    openSettings: "Open Settings",
  },
  camera: {
    asking: "Asking for the camera…",
    starting: "Getting the camera ready…",
    ready:
      "The camera sees you standing. Begin and it will follow your Positions.",
    watching: "The camera follows your Positions. Tap if it misses one.",
    notSeen: "Stand where the camera sees your whole body.",
    showPreview: "Show the camera",
    unsupported: "This device can't follow your Positions with the camera.",
    denied:
      "Camera access isn't allowed. Allow it in Settings so the assistant can follow your Salah with the camera.",
    fallback:
      "Carry on by tap: touch the screen as you move to the next Position.",
    openSettings: "Open Settings",
  },
  mat: {
    placing:
      "Lay the phone on the mat where you prostrate, screen facing up. Starting in {{value}} s.",
    calibrating: "Learning the ceiling's light. Keep the phone still.",
    watching: "Each sujud over the camera counts. Tap if one is missed.",
    covered: "Sujud seen.",
    meter: "How close a sujud is to counting",
    tooDark:
      "The room is too dark to see your sujud. Turn on a light, then recalibrate.",
    unreadable: "This device's camera can't measure light for Mat mode.",
    recalibrate: "Recalibrate",
    privacy:
      "Only the ceiling's light is measured, on this device. Nothing is kept.",
  },
  proximity: {
    placing:
      "Lay the phone on the mat where you prostrate, screen facing up. Starting in {{value}} s.",
    watching:
      "Each sujud with your forehead over the top of the phone counts. Tap if one is missed.",
    near: "Sujud seen.",
    unsupported: "This device has no proximity sensor.",
    privacy: "Only the proximity sensor is read, on this device.",
  },
  completion: {
    title: "Salah complete",
    done: "Done",
  },
};
