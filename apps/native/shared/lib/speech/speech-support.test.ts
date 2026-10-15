import { describe, expect, it } from "vitest";

import {
  isGlitch,
  MAX_FAILED_RUNS,
  sessionFailure,
  supportFromLocales,
  supportFromProbe,
} from "./speech-support";

describe("Arabic speech support on iOS (per-locale probe)", () => {
  it("is unavailable when there is no Arabic recogniser", () => {
    expect(supportFromProbe({ recognizer: false })).toStrictEqual({
      usable: false,
      reason: "no-recognizer",
    });
  });

  it("is unavailable while the recogniser is switched off", () => {
    expect(
      supportFromProbe({
        recognizer: true,
        isAvailable: false,
        supportsOnDeviceRecognition: true,
      })
    ).toStrictEqual({ usable: false, reason: "service-off" });
  });

  it("listens on the device when the Arabic model is there, else over the network", () => {
    expect(
      supportFromProbe({
        recognizer: true,
        isAvailable: true,
        supportsOnDeviceRecognition: true,
      })
    ).toStrictEqual({ usable: true, onDevice: true, locale: "ar-SA" });
    expect(
      supportFromProbe({
        recognizer: true,
        isAvailable: true,
        supportsOnDeviceRecognition: false,
      })
    ).toStrictEqual({ usable: true, onDevice: false, locale: "ar-SA" });
  });
});

describe("Arabic speech support on Android (installed locales)", () => {
  it("is unavailable without a recognition service", () => {
    expect(
      supportFromLocales({ available: false, locales: [], installed: [] })
    ).toStrictEqual({ usable: false, reason: "no-recognizer" });
  });

  it("is unavailable when the service lists locales but no Arabic", () => {
    expect(
      supportFromLocales({
        available: true,
        locales: ["en-US", "fr-FR"],
        installed: ["en-US"],
      })
    ).toStrictEqual({ usable: false, reason: "no-recognizer" });
  });

  it("uses the installed Arabic model on the device", () => {
    expect(
      supportFromLocales({
        available: true,
        locales: ["ar-EG", "ar-SA"],
        installed: ["en-US", "ar-EG"],
      })
    ).toStrictEqual({ usable: true, onDevice: true, locale: "ar-EG" });
  });

  it("falls back to the network when no Arabic model is installed or locales are unknown", () => {
    expect(
      supportFromLocales({
        available: true,
        locales: ["ar-SA"],
        installed: ["en-US"],
      })
    ).toStrictEqual({ usable: true, onDevice: false, locale: "ar-SA" });
    // Android 12 and below report no locales at all.
    expect(
      supportFromLocales({ available: true, locales: [], installed: [] })
    ).toStrictEqual({ usable: true, onDevice: false, locale: "ar-SA" });
  });
});

describe("when a listening session fails", () => {
  it("gives up at once when listening can never work", () => {
    expect(sessionFailure("not-allowed", 1)).toBe("denied");
    expect(sessionFailure("language-not-supported", 1)).toBe("no-recognizer");
    expect(sessionFailure("service-not-allowed", 1)).toBe("service-off");
    expect(sessionFailure("network", 1)).toBe("offline");
  });

  it("keeps listening through silence, interruptions and passing glitches", () => {
    expect(sessionFailure("no-speech", 1)).toBeNull();
    expect(sessionFailure("speech-timeout", 1)).toBeNull();
    expect(sessionFailure("interrupted", 1)).toBeNull();
    expect(sessionFailure("busy", 1)).toBeNull();
    expect(sessionFailure("client", MAX_FAILED_RUNS - 1)).toBeNull();
  });

  it("gives up after repeated failures without hearing anything", () => {
    expect(sessionFailure("audio-capture", MAX_FAILED_RUNS)).toBe("failing");
    expect(sessionFailure("unknown", MAX_FAILED_RUNS)).toBe("failing");
  });

  it("counts only glitches, not silence, towards giving up", () => {
    expect(isGlitch("client")).toBeTruthy();
    expect(isGlitch("no-speech")).toBeFalsy();
    expect(sessionFailure("no-speech", MAX_FAILED_RUNS)).toBeNull();
  });
});
