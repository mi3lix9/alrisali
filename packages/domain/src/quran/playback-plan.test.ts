import { describe, expect, it } from "vitest";

import { isPlayToReachable, playbackPlan, playToEnd } from ".";

describe(playToEnd, () => {
  it("ends the page at its last ayah, from the first ayah of the Quran", () => {
    expect(playToEnd("1:1", { kind: "page" })).toBe("1:7");
  });

  it("ends the page at the last ayah of the Quran", () => {
    expect(playToEnd("114:6", { kind: "page" })).toBe("114:6");
  });

  it("ends the page where the page's own ayat end, from any ayah on it", () => {
    // Page 42 opens at 2:253 and holds 2:255.
    expect(playToEnd("2:255", { kind: "page" })).toBe(
      playToEnd("2:253", { kind: "page" })
    );
    expect(playToEnd("2:255", { kind: "page" })?.startsWith("2:")).toBeTruthy();
  });

  it("ends the surah at its last ayah", () => {
    expect(playToEnd("1:1", { kind: "surah" })).toBe("1:7");
    expect(playToEnd("2:255", { kind: "surah" })).toBe("2:286");
    expect(playToEnd("114:1", { kind: "surah" })).toBe("114:6");
  });

  it("ends the juz one ayah before the next juz opens", () => {
    // KFGQPC opens Juz 2 at 2:142.
    expect(playToEnd("1:1", { kind: "juz" })).toBe("2:141");
    expect(playToEnd("2:141", { kind: "juz" })).toBe("2:141");
    expect(playToEnd("2:142", { kind: "juz" })).not.toBe("2:141");
  });

  it("ends juz 30 at the last ayah of the Quran", () => {
    expect(playToEnd("78:1", { kind: "juz" })).toBe("114:6");
    expect(playToEnd("114:6", { kind: "juz" })).toBe("114:6");
  });

  it("ends at a chosen ayah, including the ayah it starts at", () => {
    expect(playToEnd("2:255", { kind: "ayah", ayah: "3:10" })).toBe("3:10");
    expect(playToEnd("1:1", { kind: "ayah", ayah: "1:1" })).toBe("1:1");
  });

  it("plays on to the end of the Quran for plain Play", () => {
    expect(playToEnd("1:1", { kind: "quran" })).toBeNull();
  });

  it("refuses a chosen ayah before the start, and ayat that do not exist", () => {
    expect(() => playToEnd("2:255", { kind: "ayah", ayah: "2:254" })).toThrow(
      RangeError
    );
    expect(() => playToEnd("2:255", { kind: "ayah", ayah: "1:7" })).toThrow(
      RangeError
    );
    expect(() => playToEnd("2:300", { kind: "page" })).toThrow(RangeError);
  });
});

describe(isPlayToReachable, () => {
  it("accepts a chosen ayah at or after the start only", () => {
    expect(
      isPlayToReachable("2:255", { kind: "ayah", ayah: "2:255" })
    ).toBeTruthy();
    expect(
      isPlayToReachable("2:255", { kind: "ayah", ayah: "2:256" })
    ).toBeTruthy();
    expect(
      isPlayToReachable("2:255", { kind: "ayah", ayah: "2:254" })
    ).toBeFalsy();
    expect(
      isPlayToReachable("2:255", { kind: "ayah", ayah: "2:999" })
    ).toBeFalsy();
  });

  it("accepts every other end from a real ayah", () => {
    expect(isPlayToReachable("1:1", { kind: "juz" })).toBeTruthy();
    expect(isPlayToReachable("9:9999", { kind: "juz" })).toBeFalsy();
  });
});

describe(playbackPlan, () => {
  it("plays once at normal speed with no pause, repeat or sleep", () => {
    expect(playbackPlan("2:255", { kind: "surah" })).toStrictEqual({
      from: "2:255",
      to: { kind: "surah" },
      ayahRepeat: 1,
      rangeRepeat: 1,
      pause: { kind: "none" },
      speed: 1,
      sleep: { kind: "off" },
      askToContinueAtEnd: true,
    });
  });

  it("goes to the end of the Quran when no end is given", () => {
    expect(playbackPlan("1:1").to).toStrictEqual({ kind: "quran" });
  });
});
