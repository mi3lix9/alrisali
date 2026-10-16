import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Qibla",
  bearing: "{{degrees}}° {{direction}}",
  bearingLabel: "Qibla at {{degrees}} degrees {{direction}} from north",
  bearingTargetLabel:
    "{{target}} at {{degrees}} degrees {{direction}} from north",
  distance: "{{distance}} km to {{target}}",
  targets: {
    label: "Direction to",
    kaaba: "Kaaba",
    najaf: "Najaf",
    karbala: "Karbala",
    mashhad: "Mashhad",
    madina: "Madina",
    kadhimiya: "Kadhimiya",
    samarra: "Samarra",
  },
  notQibla:
    "This is the direction of {{target}}, not the Qibla. Choose the Kaaba to return to the Qibla.",
  directions: {
    n: "N",
    ne: "NE",
    e: "E",
    se: "SE",
    s: "S",
    sw: "SW",
    w: "W",
    nw: "NW",
  },
  north: "N",
  facing: "You're facing the Qibla",
  facingTarget: "You're facing {{target}}",
  turnRight: "Turn right {{degrees}}°",
  turnLeft: "Turn left {{degrees}}°",
  nearRight: "Nearly there · a little right",
  nearLeft: "Nearly there · a little left",
  declination: "Magnetic declination here {{degrees}}° {{direction}} · applied",
  declinationLabel:
    "Compass corrected to true north by a magnetic declination of {{degrees}} degrees {{direction}}",
  declinationEast: "east",
  declinationWest: "west",
  level: {
    label: "Bubble level",
    level: "The phone is level",
    tilted: "Hold the phone flat for a more accurate reading",
    tilt: "Tilt {{degrees}}°",
  },
  noLocation: {
    title: "Set your location",
    description:
      "The Qibla is worked out from where you are. Set your location in the Prayer tab.",
    action: "Set location",
  },
  compass: {
    checking: "Starting the compass…",
    waiting: "Waiting for the compass…",
    permissionTitle: "The compass needs location access",
    permissionDescription:
      "The compass reads your device's heading through location services, so it needs location access to point to the Qibla.",
    allow: "Allow location access",
    blockedDescription:
      "Location access isn't allowed. Allow it in the device's Settings for the compass to work.",
    openSettings: "Open Settings",
    unavailableTitle: "Compass unavailable",
    unavailableDescription:
      "This device doesn't report a compass heading. Use the Qibla's degrees from north instead.",
    calibrateTitle: "The compass is inaccurate",
    calibrateDescription:
      "Move your phone through the air in a figure eight to calibrate it, away from metal and electronics.",
  },
};
