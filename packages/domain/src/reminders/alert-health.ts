/** What could stop an alert arriving. The order is how serious it is. */
export const ALERT_CHECKS = [
  "notifications",
  "sound",
  "exactAlarms",
  "batteryOptimisation",
  "autostart",
] as const;
export type AlertCheckId = (typeof ALERT_CHECKS)[number];

export interface AlertCheck {
  id: AlertCheckId;
  status: "ok" | "failing";
}

/** What the phone says, read by the app (the domain never asks the phone). */
export interface AlertHealthReadings {
  platform: "ios" | "android";
  /** Something is set to arrive as an alert (`sendsNotifications`). */
  alertsInUse: boolean;
  /** The app may show notifications. */
  notifications: boolean;
  /** iPhone: the app's notifications may play sound. */
  sound: boolean;
  /** Android: alarms fire on time (true where there is no such permission). */
  exactAlarms: boolean;
  /** Android: battery optimisation may delay the app's alarms. */
  batteryOptimised: boolean;
  /**
   * Android: the phone maker's autostart setting. Android cannot say whether
   * it is on, so the Believer confirms it once after opening the screen.
   */
  autostart: { screenKnown: boolean; confirmed: boolean };
}

/** A notification this long after "Send test alert" shows the fix worked. */
export const TEST_ALERT_DELAY_SECONDS = 5;

const status = (ok: boolean): AlertCheck["status"] => (ok ? "ok" : "failing");

/** The checks that apply on this phone, each passing or failing. */
export const alertChecks = (readings: AlertHealthReadings): AlertCheck[] => {
  const checks: AlertCheck[] =
    readings.platform === "ios"
      ? [
          { id: "notifications", status: status(readings.notifications) },
          { id: "sound", status: status(readings.sound) },
        ]
      : [
          { id: "notifications", status: status(readings.notifications) },
          { id: "exactAlarms", status: status(readings.exactAlarms) },
          {
            id: "batteryOptimisation",
            status: status(!readings.batteryOptimised),
          },
          ...(readings.autostart.screenKnown
            ? [
                {
                  id: "autostart" as const,
                  status: status(readings.autostart.confirmed),
                },
              ]
            : []),
        ];
  return checks;
};

/**
 * The failing checks, most serious first, that Settings' dot and Home's banner
 * report: none while no alert is set to arrive.
 */
export const alertProblems = (readings: AlertHealthReadings): AlertCheckId[] =>
  readings.alertsInUse
    ? alertChecks(readings)
        .filter((check) => check.status === "failing")
        .map((check) => check.id)
    : [];
