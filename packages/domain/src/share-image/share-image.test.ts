import { AYAT } from "@alrisali/content/quran";
import { describe, expect, it } from "vitest";

import {
  AUDHU,
  BISMILLAH,
  DEFAULT_SHARE_IMAGE_OPTIONS,
  fitShareText,
  openerText,
  SHARE_IMAGE_SIZES,
  shareImageFileName,
  shareImageSize,
  shareTextBox,
  shareTimesRowHeight,
  shareTimesSchema,
} from "./share-image";

const ayah = (key: string) => {
  const found = AYAT.find((item) => item.key === key);
  if (!found) {
    throw new Error(key);
  }
  return found.text;
};

describe("share image sizes", () => {
  it("are 1:1, 4:5 and 9:16", () => {
    const ratios = SHARE_IMAGE_SIZES.map(({ width, height }) => width / height);
    expect(ratios).toStrictEqual([1, 4 / 5, 9 / 16]);
  });
});

describe(openerText, () => {
  it("is empty for none, the mushaf's Bismillah or the A'udhu", () => {
    expect(openerText("none")).toBeNull();
    expect(openerText("bismillah")).toBe(BISMILLAH);
    expect(openerText("audhu")).toBe(AUDHU);
    expect(ayah("1:1").startsWith(BISMILLAH)).toBeTruthy();
  });
});

describe(shareTextBox, () => {
  const story = shareImageSize("story");

  it("gives the text less room for an opener", () => {
    const plain = shareTextBox(story, DEFAULT_SHARE_IMAGE_OPTIONS);
    const opened = shareTextBox(story, {
      ...DEFAULT_SHARE_IMAGE_OPTIONS,
      opener: "bismillah",
    });
    expect(opened.height).toBeLessThan(plain.height);
  });

  it("gives the text more room once the attribution is off", () => {
    const on = shareTextBox(story, DEFAULT_SHARE_IMAGE_OPTIONS);
    const off = shareTextBox(story, {
      ...DEFAULT_SHARE_IMAGE_OPTIONS,
      attribution: false,
    });
    expect(off.height).toBeGreaterThan(on.height);
  });
});

describe(fitShareText, () => {
  const options = DEFAULT_SHARE_IMAGE_OPTIONS;

  it("sets a short ayah large", () => {
    const { fontSize, fits } = fitShareText(
      ayah("112:1"),
      shareTextBox(shareImageSize("square"), options)
    );
    expect(fits).toBeTruthy();
    expect(fontSize).toBeGreaterThanOrEqual(60);
  });

  it("sets Ayat al-Kursi smaller than a short ayah", () => {
    const box = shareTextBox(shareImageSize("story"), options);
    const short = fitShareText(ayah("112:1"), box);
    const kursi = fitShareText(ayah("2:255"), box);
    expect(kursi.fits).toBeTruthy();
    expect(kursi.fontSize).toBeLessThan(short.fontSize);
  });

  it("sets the same ayah larger on a taller image", () => {
    const square = fitShareText(
      ayah("2:255"),
      shareTextBox(shareImageSize("square"), options)
    );
    const story = fitShareText(
      ayah("2:255"),
      shareTextBox(shareImageSize("story"), options)
    );
    expect(story.fontSize).toBeGreaterThan(square.fontSize);
  });

  it("says so when the longest ayah does not fit a square", () => {
    const { fits } = fitShareText(
      ayah("2:282"),
      shareTextBox(shareImageSize("square"), options)
    );
    expect(fits).toBeFalsy();
  });

  it("fits the longest ayah on a story", () => {
    const { fits } = fitShareText(
      ayah("2:282"),
      shareTextBox(shareImageSize("story"), {
        ...options,
        attribution: false,
      })
    );
    expect(fits).toBeTruthy();
  });
});

describe("share times", () => {
  it("accepts a day's times and refuses none", () => {
    const times = {
      title: "t",
      subtitle: "s",
      rows: [{ label: "الفجر", time: "04:22" }],
      footer: null,
    };
    expect(shareTimesSchema.safeParse(times).success).toBeTruthy();
    expect(
      shareTimesSchema.safeParse({ ...times, rows: [] }).success
    ).toBeFalsy();
  });
});

describe(shareImageFileName, () => {
  it("names the image after its subject and size", () => {
    expect(shareImageFileName("ayah 2:255", "story")).toBe(
      "alrisali-ayah-2-255-story.png"
    );
  });
});

describe(shareTimesRowHeight, () => {
  it("keeps nine rows on a square and gives a story's rows more room", () => {
    const options = DEFAULT_SHARE_IMAGE_OPTIONS;
    const square = shareTimesRowHeight(shareImageSize("square"), 9, options);
    const story = shareTimesRowHeight(shareImageSize("story"), 9, options);
    expect(square).toBeGreaterThanOrEqual(40);
    expect(story).toBeGreaterThan(square);
  });
});
