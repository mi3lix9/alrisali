import type { AyahKey } from "@alrisali/content/quran";
import { shareTimesSchema } from "@alrisali/domain/share-image";
import type { ShareTimes } from "@alrisali/domain/share-image";

/** What the composer is asked to share, as the route's params carry it. */
export type ShareRequest =
  | { kind: "ayah"; ayah: AyahKey }
  | { kind: "supplication"; id: string }
  | { kind: "times"; times: ShareTimes };

export type ShareParams = Record<string, string>;

export const shareRequestParams = (request: ShareRequest): ShareParams => {
  switch (request.kind) {
    case "ayah": {
      return { kind: "ayah", ayah: request.ayah };
    }
    case "supplication": {
      return { kind: "supplication", id: request.id };
    }
    case "times": {
      return { kind: "times", times: JSON.stringify(request.times) };
    }
    default: {
      return request satisfies never;
    }
  }
};

const AYAH_KEY = /^\d{1,3}:\d{1,3}$/u;

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/** The request a composer route's params describe, or null when they don't. */
export const readShareRequest = (
  params: Record<string, string | string[] | undefined>
): ShareRequest | null => {
  const kind = first(params.kind);
  if (kind === "ayah") {
    const ayah = first(params.ayah);
    return ayah && AYAH_KEY.test(ayah) ? { kind, ayah: ayah as AyahKey } : null;
  }
  if (kind === "supplication") {
    const id = first(params.id);
    return id ? { kind, id } : null;
  }
  if (kind === "times") {
    try {
      const times = shareTimesSchema.safeParse(
        JSON.parse(first(params.times) ?? "null")
      );
      return times.success ? { kind, times: times.data } : null;
    } catch {
      return null;
    }
  }
  return null;
};
