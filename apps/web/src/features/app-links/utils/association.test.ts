import { describe, expect, it } from "vitest";

import { appleAppSiteAssociation, assetLinks } from "./association";

const SHA = Array.from({ length: 32 }, (_, i) =>
  i.toString(16).padStart(2, "0").toUpperCase()
).join(":");

describe("the Apple association file", () => {
  it("is not served without a Team ID", () => {
    expect(appleAppSiteAssociation()).toBeNull();
    expect(appleAppSiteAssociation("  ")).toBeNull();
  });

  it("hands the link paths to the production app", () => {
    const file = appleAppSiteAssociation("ABCDE12345");
    expect(file?.applinks.details[0]?.appIDs).toStrictEqual([
      "ABCDE12345.com.alrisali.app",
    ]);
    expect(file?.applinks.details[0]?.components).toContainEqual({
      "/": "/ayah*",
    });
  });
});

describe("the Android asset links file", () => {
  it("is not served without fingerprints, or with a malformed one", () => {
    expect(assetLinks()).toBeNull();
    expect(assetLinks("")).toBeNull();
    expect(assetLinks("AB:CD")).toBeNull();
    expect(assetLinks(`${SHA},nope`)).toBeNull();
  });

  it("lists every signing fingerprint for the production package", () => {
    const [entry] = assetLinks(`${SHA.toLowerCase()}, ${SHA}`) ?? [];
    expect(entry?.target).toStrictEqual({
      namespace: "android_app",
      package_name: "com.alrisali.app",
      sha256_cert_fingerprints: [SHA, SHA],
    });
  });
});
