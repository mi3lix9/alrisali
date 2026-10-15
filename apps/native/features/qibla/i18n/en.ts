import type { Catalog } from "@alrisali/i18n";

import type { ar } from "./ar";

export const en: Catalog<typeof ar> = {
  title: "Qibla",
  bearing: "{{degrees}}° {{direction}}",
  bearingLabel: "Qibla at {{degrees}} degrees {{direction}} from north",
  distance: "{{distance}} km to the Kaaba",
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
  turnRight: "Turn right {{degrees}}°",
  turnLeft: "Turn left {{degrees}}°",
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
      "Your device uses your location to find true north, so the compass points to the Qibla accurately.",
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
    magneticNorth:
      "The compass is using magnetic north for now, so the direction may be a few degrees off.",
  },
};
