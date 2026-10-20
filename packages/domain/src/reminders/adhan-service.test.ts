import { describe, expect, it } from "vitest";

import {
  adhanPlayback,
  adhanServiceSettingsSchema,
  DEFAULT_ADHAN_SERVICE_SETTINGS,
} from "./adhan-service";

describe(adhanPlayback, () => {
  it("plays on the stream the Believer chose when Do Not Disturb is off", () => {
    expect(
      adhanPlayback(
        { ...DEFAULT_ADHAN_SERVICE_SETTINGS, stream: "media" },
        false
      )
    ).toBe("media");
    expect(adhanPlayback(DEFAULT_ADHAN_SERVICE_SETTINGS, false)).toBe("alarm");
  });

  it("stays silent during Do Not Disturb unless the Believer allowed it", () => {
    expect(adhanPlayback(DEFAULT_ADHAN_SERVICE_SETTINGS, true)).toBe("skip");
  });

  it("plays on the alarm stream when allowed through Do Not Disturb, even if media was chosen", () => {
    expect(
      adhanPlayback(
        { stream: "media", playDuringDnd: true, fullScreen: false },
        true
      )
    ).toBe("alarm");
  });
});

describe("adhan service settings", () => {
  it("accepts the defaults and rejects an unknown stream", () => {
    expect(
      adhanServiceSettingsSchema.safeParse(DEFAULT_ADHAN_SERVICE_SETTINGS)
        .success
    ).toBeTruthy();
    expect(
      adhanServiceSettingsSchema.safeParse({
        ...DEFAULT_ADHAN_SERVICE_SETTINGS,
        stream: "ring",
      }).success
    ).toBeFalsy();
  });
});
