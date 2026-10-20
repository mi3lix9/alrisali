import { LINK_PATH_ROOTS as DOMAIN_ROOTS } from "@alrisali/domain/shared";
import { describe, expect, it } from "vitest";

import { LINK_PATH_ROOTS, universalLinks } from "./app.config";

describe("the universal links in the app config", () => {
  it("hand the app the same paths the domain parses", () => {
    expect(LINK_PATH_ROOTS).toStrictEqual(DOMAIN_ROOTS);
  });

  it("are off without a web domain", () => {
    expect(universalLinks()).toStrictEqual({ ios: {}, android: {} });
  });

  it("associate the web domain on iOS and verify every link path on Android", () => {
    const { ios, android } = universalLinks("alrisali.app");
    expect(ios.associatedDomains).toStrictEqual(["applinks:alrisali.app"]);
    expect(android.intentFilters).toHaveLength(1);
    expect(android.intentFilters?.[0]).toMatchObject({
      action: "VIEW",
      autoVerify: true,
    });
    expect(android.intentFilters?.[0]?.data).toStrictEqual(
      DOMAIN_ROOTS.map((root) => ({
        scheme: "https",
        host: "alrisali.app",
        pathPrefix: `/${root}`,
      }))
    );
  });
});
