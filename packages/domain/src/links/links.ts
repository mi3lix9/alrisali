/** An ayah as `surah:ayah`; the Quran decides which exist. */
export type AyahRef = `${number}:${number}`;

/**
 * What exists in the app, which a link may name. The app supplies it from its
 * Quran and its Books; a link to anything else opens nothing.
 */
export interface LinkTargets {
  hasAyah: (key: string) => boolean;
  hasSupplication: (id: string) => boolean;
  isPage: (page: number) => boolean;
  isSurah: (surah: number) => boolean;
}

/** What a link can open. */
export type AppLink =
  | { kind: "ayah"; ayah: AyahRef }
  /** The reader: at a page or Surah, or at the Last-Read Ayah with neither. */
  | { kind: "quran"; page?: number; surah?: number }
  | { kind: "supplication"; id: string }
  /** A Khatmah by id, or the Khatmah screen. */
  | { kind: "khatmah"; id?: string }
  | { kind: "qibla" }
  | { kind: "tasbih" }
  /** The Hijri calendar. */
  | { kind: "calendar" }
  /** The Prayer tab, where the next Salah is counted down. */
  | { kind: "next-salah" };

export type AppLinkKind = AppLink["kind"];

/** The scheme of the app's own links. */
export const LINK_SCHEME = "alrisali";

/**
 * The Feature Registry id each link kind opens. A kind may name a feature the
 * registry does not hold; the app then falls back to Home.
 */
export const linkFeatureId = (link: AppLink): string => {
  switch (link.kind) {
    case "ayah":
    case "quran": {
      return "quran";
    }
    case "supplication": {
      return "library";
    }
    case "next-salah": {
      return "prayer";
    }
    case "calendar":
    case "khatmah":
    case "qibla":
    case "tasbih": {
      return link.kind;
    }
    default: {
      return link satisfies never;
    }
  }
};

const URL_PARTS =
  /^(?<scheme>[a-z][a-z0-9+.-]*):\/\/(?<host>[^/?#]*)(?<path>[^?#]*)(?:\?(?<query>[^#]*))?/iu;
const AYAH_KEY = /^\d{1,3}:\d{1,3}$/u;
const DIGITS = /^\d{1,4}$/u;
const ID = /^[\w-]{1,100}$/u;

const decode = (part: string): string | null => {
  try {
    return decodeURIComponent(part);
  } catch {
    return null;
  }
};

const queryOf = (query: string | undefined): Map<string, string> => {
  const params = new Map<string, string>();
  for (const pair of (query ?? "").split("&")) {
    const [rawKey, rawValue = ""] = pair.split("=");
    const key = decode(rawKey ?? "");
    const value = decode(rawValue.replaceAll("+", " "));
    if (key && value !== null && !params.has(key)) {
      params.set(key, value);
    }
  }
  return params;
};

const ayahLink = (
  key: string | undefined,
  targets: LinkTargets
): AppLink | null =>
  key !== undefined && AYAH_KEY.test(key) && targets.hasAyah(key)
    ? { kind: "ayah", ayah: key as AyahRef }
    : null;

const numberIn = (
  value: string | undefined,
  valid: (n: number) => boolean
): number | null => {
  if (value === undefined || !DIGITS.test(value)) {
    return null;
  }
  const n = Number(value);
  return valid(n) ? n : null;
};

const quranLink = (
  params: Map<string, string>,
  targets: LinkTargets
): AppLink | null => {
  if (params.has("ayah")) {
    return ayahLink(params.get("ayah"), targets);
  }
  if (params.has("page")) {
    const page = numberIn(params.get("page"), targets.isPage);
    return page === null ? null : { kind: "quran", page };
  }
  if (params.has("surah")) {
    const surah = numberIn(params.get("surah"), targets.isSurah);
    return surah === null ? null : { kind: "quran", surah };
  }
  return { kind: "quran" };
};

const supplicationLink = (
  id: string | undefined,
  targets: LinkTargets
): AppLink | null =>
  id !== undefined && ID.test(id) && targets.hasSupplication(id)
    ? { kind: "supplication", id }
    : null;

const khatmahLink = (id: string | undefined): AppLink | null => {
  if (id === undefined) {
    return { kind: "khatmah" };
  }
  return ID.test(id) ? { kind: "khatmah", id } : null;
};

const fromSegments = (
  segments: readonly string[],
  params: Map<string, string>,
  targets: LinkTargets
): AppLink | null => {
  const [head, arg, ...rest] = segments;
  if (rest.length > 0) {
    return null;
  }
  switch (head) {
    case "ayah": {
      return ayahLink(arg ?? params.get("key"), targets);
    }
    case "quran": {
      return arg === undefined ? quranLink(params, targets) : null;
    }
    case "supplication": {
      return supplicationLink(arg ?? params.get("id"), targets);
    }
    case "khatmah": {
      return khatmahLink(arg ?? params.get("id"));
    }
    case "calendar":
    case "qibla":
    case "tasbih": {
      return arg === undefined ? { kind: head } : null;
    }
    case "prayer":
    case "next-salah": {
      return arg === undefined ? { kind: "next-salah" } : null;
    }
    default: {
      return null;
    }
  }
};

/** The path segments a URL addresses: its host too, for our own scheme. */
const segmentsOf = (
  url: string,
  webHosts: readonly string[]
): { segments: string[]; query: string | undefined } | null => {
  const groups = URL_PARTS.exec(url.trim())?.groups;
  if (!groups) {
    return null;
  }
  const scheme = (groups["scheme"] ?? "").toLowerCase();
  const host = (groups["host"] ?? "").toLowerCase();
  const path = (groups["path"] ?? "")
    .split("/")
    .filter((segment) => segment !== "")
    .map(decode);
  const isOurs = scheme === LINK_SCHEME;
  const isOnOurDomain =
    (scheme === "https" || scheme === "http") &&
    webHosts.some((webHost) => webHost.toLowerCase() === host);
  const segments = isOurs ? [host, ...path] : path;
  if (!(isOurs || isOnOurDomain) || segments.includes(null)) {
    return null;
  }
  return { segments: segments as string[], query: groups["query"] };
};

/**
 * The link a URL opens, or null when it is not one of ours or names nothing
 * that exists (an ayah the Quran does not have, an unknown Supplication).
 *
 * Accepts `alrisali://ayah/2:255` and, on a web domain the app is associated
 * with (`webHosts`), `https://<host>/ayah/2:255`. The older
 * `alrisali://quran?ayah=2:255` form is kept.
 */
export const parseLink = (
  url: string,
  webHosts: readonly string[],
  targets: LinkTargets
): AppLink | null => {
  const parts = segmentsOf(url, webHosts);
  return parts
    ? fromSegments(parts.segments, queryOf(parts.query), targets)
    : null;
};

const pathOf = (link: AppLink): string => {
  switch (link.kind) {
    case "ayah": {
      return `ayah/${link.ayah}`;
    }
    case "quran": {
      if (link.page !== undefined) {
        return `quran?page=${link.page}`;
      }
      return link.surah === undefined ? "quran" : `quran?surah=${link.surah}`;
    }
    case "supplication": {
      return `supplication/${encodeURIComponent(link.id)}`;
    }
    case "khatmah": {
      return link.id === undefined
        ? "khatmah"
        : `khatmah/${encodeURIComponent(link.id)}`;
    }
    case "next-salah": {
      return "next-salah";
    }
    case "calendar":
    case "qibla":
    case "tasbih": {
      return link.kind;
    }
    default: {
      return link satisfies never;
    }
  }
};

/** The `alrisali://` URL for a link. */
export const appLinkUrl = (link: AppLink): string =>
  `${LINK_SCHEME}://${pathOf(link)}`;

/** The universal link for a link on `origin` (e.g. `https://alrisali.app`). */
export const webLinkUrl = (link: AppLink, origin: string): string =>
  `${origin.replace(/\/+$/u, "")}/${pathOf(link)}`;

/**
 * The link to send a friend: on the app's web domain when it has one (a
 * universal link, which also opens in a browser for someone without the app),
 * else the app's own `alrisali://` link.
 */
export const shareableLinkUrl = (link: AppLink, domain?: string): string =>
  domain ? webLinkUrl(link, `https://${domain}`) : appLinkUrl(link);

/**
 * The long-press shortcuts on the app icon, in the order the system shows
 * them. The app supplies each one's title.
 */
export const ICON_SHORTCUTS = [
  { id: "qibla", link: { kind: "qibla" } },
  { id: "tasbih", link: { kind: "tasbih" } },
  { id: "continue-reading", link: { kind: "quran" } },
  { id: "next-salah", link: { kind: "next-salah" } },
] as const satisfies readonly { id: string; link: AppLink }[];

export type IconShortcutId = (typeof ICON_SHORTCUTS)[number]["id"];
