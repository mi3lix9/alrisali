import { describe, expect, it } from "vitest";

import { FEATURES } from "../shared/features";
import { LINK_PATH_ROOTS } from "../shared/link-paths";
import {
  appLinkUrl,
  ICON_SHORTCUTS,
  linkFeatureId,
  parseLink,
  webLinkUrl,
} from "./links";
import type { AppLink, LinkTargets } from "./links";

const HOSTS = ["alrisali.app"];
const DUA = "dua-kumayl";

// The Quran has 114 Surahs and 604 pages; Al-Baqarah ends at 2:286.
const TARGETS: LinkTargets = {
  hasAyah: (key) => ["1:1", "2:255", "18:10", "114:6"].includes(key),
  hasSupplication: (id) => id === DUA,
  isPage: (page) => page >= 1 && page <= 604,
  isSurah: (surah) => surah >= 1 && surah <= 114,
};

const parse = (url: string) => parseLink(url, HOSTS, TARGETS);

describe(parseLink, () => {
  it.each([
    ["alrisali://ayah/2:255", { kind: "ayah", ayah: "2:255" }],
    ["alrisali://quran?ayah=2:255", { kind: "ayah", ayah: "2:255" }],
    ["https://alrisali.app/ayah/114:6", { kind: "ayah", ayah: "114:6" }],
    ["https://ALRISALI.app/ayah/1:1?utm=x", { kind: "ayah", ayah: "1:1" }],
    ["alrisali://quran", { kind: "quran" }],
    ["alrisali://quran?page=50", { kind: "quran", page: 50 }],
    ["alrisali://quran?surah=18", { kind: "quran", surah: 18 }],
    [`alrisali://supplication/${DUA}`, { kind: "supplication", id: DUA }],
    [
      `https://alrisali.app/supplication/${DUA}`,
      { kind: "supplication", id: DUA },
    ],
    ["alrisali://khatmah", { kind: "khatmah" }],
    ["alrisali://khatmah/abc-123", { kind: "khatmah", id: "abc-123" }],
    ["alrisali://qibla", { kind: "qibla" }],
    ["alrisali://tasbih", { kind: "tasbih" }],
    ["alrisali://calendar", { kind: "calendar" }],
    ["alrisali://next-salah", { kind: "next-salah" }],
    ["https://alrisali.app/prayer", { kind: "next-salah" }],
  ] as const)("reads %s", (url, link) => {
    expect(parse(url)).toStrictEqual(link);
  });

  it.each([
    "",
    "not a url",
    "alrisali://",
    "alrisali://unknown",
    "alrisali://ayah/115:1",
    "alrisali://ayah/2:287",
    "alrisali://ayah/3:1",
    "alrisali://ayah/abc",
    "alrisali://ayah",
    "alrisali://quran?page=605",
    "alrisali://quran?surah=0",
    "alrisali://supplication/no-such-dua",
    "alrisali://qibla/extra",
    "alrisali://ayah/%E0%A4%A",
    "https://evil.example/ayah/2:255",
    "ftp://alrisali.app/ayah/2:255",
  ])("reads %j as no link", (url) => {
    expect(parse(url)).toBeNull();
  });
});

describe("appLinkUrl and webLinkUrl", () => {
  const links: AppLink[] = [
    { kind: "ayah", ayah: "2:255" },
    { kind: "quran" },
    { kind: "quran", page: 7 },
    { kind: "quran", surah: 36 },
    { kind: "supplication", id: DUA },
    { kind: "khatmah" },
    { kind: "khatmah", id: "k-1" },
    { kind: "qibla" },
    { kind: "tasbih" },
    { kind: "calendar" },
    { kind: "next-salah" },
  ];

  it.each(links)("round-trips %j", (link) => {
    expect(parse(appLinkUrl(link))).toStrictEqual(link);
    expect(parse(webLinkUrl(link, "https://alrisali.app/"))).toStrictEqual(
      link
    );
  });
});

describe(linkFeatureId, () => {
  it("names a registered feature for every link kind", () => {
    const ids = new Set<string>(FEATURES.map((feature) => feature.id));
    const unregistered = [
      { kind: "ayah", ayah: "1:1" },
      { kind: "quran" },
      { kind: "supplication", id: DUA },
      { kind: "khatmah" },
      { kind: "qibla" },
      { kind: "tasbih" },
      { kind: "calendar" },
      { kind: "next-salah" },
    ].filter((link) => !ids.has(linkFeatureId(link as AppLink)));
    expect(unregistered).toStrictEqual([]);
  });
});

describe("the icon shortcuts", () => {
  it("opens Qibla, Tasbih, Continue reading and the next Salah", () => {
    expect(
      ICON_SHORTCUTS.map(({ id, link }) => [id, appLinkUrl(link)])
    ).toStrictEqual([
      ["qibla", "alrisali://qibla"],
      ["tasbih", "alrisali://tasbih"],
      ["continue-reading", "alrisali://quran"],
      ["next-salah", "alrisali://next-salah"],
    ]);
  });
});

describe("the link path roots", () => {
  it("names the first segment of every link the app parses", () => {
    const parsed = [
      "ayah/2:255",
      "quran",
      `supplication/${DUA}`,
      "khatmah",
      "calendar",
      "qibla",
      "tasbih",
      "next-salah",
      "prayer",
    ];
    expect(parsed.map((path) => path.split("/")[0])).toStrictEqual([
      ...LINK_PATH_ROOTS,
    ]);
    for (const path of parsed) {
      expect(parse(`https://alrisali.app/${path}`)).not.toBeNull();
    }
  });
});
