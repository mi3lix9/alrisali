import type { LinkTargets } from "@alrisali/domain/links";
import { describe, expect, it } from "vitest";

import { resolveLink } from "./resolve-link";

const HOSTS = ["alrisali.app"];
const DUA = "dua-kumayl";

const TARGETS: LinkTargets = {
  hasAyah: (key) => ["2:255", "18:10"].includes(key),
  hasSupplication: (id) => id === DUA,
  isPage: (page) => page >= 1 && page <= 604,
  isSurah: (surah) => surah >= 1 && surah <= 114,
};

describe(resolveLink, () => {
  it.each([
    ["alrisali://ayah/2:255", "/quran?ayah=2:255"],
    ["https://alrisali.app/ayah/18:10", "/quran?ayah=18:10"],
    ["alrisali://quran?page=50", "/quran?page=50"],
    ["alrisali://quran", "/quran"],
    [`alrisali://supplication/${DUA}`, `/library/supplication/${DUA}`],
    ["alrisali://qibla", "/qibla"],
    ["alrisali://tasbih", "/tasbih"],
    ["alrisali://next-salah", "/prayer"],
    ["alrisali://khatmah", "/khatmah"],
    ["alrisali://khatmah/abc", "/khatmah?id=abc"],
  ])("opens %s at %s", (url, path) => {
    expect(resolveLink(url, HOSTS, TARGETS)).toBe(path);
  });

  it.each([
    "alrisali://nothing",
    "alrisali://ayah/999:1",
    "https://other.example/ayah/2:255",
  ])("opens nothing for %s", (url) => {
    expect(resolveLink(url, HOSTS, TARGETS)).toBeNull();
  });
});
