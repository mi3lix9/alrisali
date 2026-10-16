import { linkFeatureId, parseLink } from "@alrisali/domain/links";
import type { AppLink, LinkTargets } from "@alrisali/domain/links";
import { FEATURES } from "@alrisali/domain/shared";
import type { FeatureId } from "@alrisali/domain/shared";

import { FEATURE_LINKS } from "@/shared/lib/features";

/** Home: where a link that opens nothing lands. */
export const HOME_PATH = "/";

const isFeatureId = (id: string): id is FeatureId =>
  FEATURES.some((feature) => feature.id === id);

/** The route a registered feature opens at, or null for one without it. */
const featurePath = (id: string): string | null => {
  if (!isFeatureId(id)) {
    return null;
  }
  const { href } = FEATURE_LINKS[id];
  return typeof href === "string" ? href : href.pathname;
};

/**
 * The route a link opens: its feature's route in the Feature Registry, with
 * the link's own target (an ayah, a Supplication) added. Null when the
 * registry has no such feature, e.g. before Khatmahs exist.
 */
export const linkPath = (link: AppLink): string | null => {
  const base = featurePath(linkFeatureId(link));
  if (base === null) {
    return null;
  }
  switch (link.kind) {
    case "ayah": {
      return `${base}?ayah=${link.ayah}`;
    }
    case "quran": {
      if (link.page !== undefined) {
        return `${base}?page=${link.page}`;
      }
      return link.surah === undefined ? base : `${base}?surah=${link.surah}`;
    }
    case "supplication": {
      return `${base}/supplication/${encodeURIComponent(link.id)}`;
    }
    case "khatmah": {
      return link.id === undefined
        ? base
        : `${base}?id=${encodeURIComponent(link.id)}`;
    }
    case "qibla":
    case "tasbih":
    case "next-salah": {
      return base;
    }
    default: {
      return link satisfies never;
    }
  }
};

/**
 * The route an incoming URL opens (a custom-scheme or universal link), or
 * null when it is not a link of ours or its feature is not in the registry.
 */
export const resolveLink = (
  url: string,
  webHosts: readonly string[],
  targets: LinkTargets
): string | null => {
  const link = parseLink(url, webHosts, targets);
  return link === null ? null : linkPath(link);
};
