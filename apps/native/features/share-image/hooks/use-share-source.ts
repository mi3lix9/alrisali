import { getSupplication, loadSupplicationText } from "@alrisali/content/books";
import { AYAT, SURAHS } from "@alrisali/content/quran";
import type { ShareTimes } from "@alrisali/domain/share-image";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";
import { launchLanguage } from "@/shared/lib/preferences";

import type { ShareRequest } from "../utils/share-route";

/** What the composer draws, resolved from a request. */
export type ShareSource =
  | {
      kind: "ayah";
      text: string;
      reference: string;
      /** Names the saved file. */
      subject: string;
    }
  | {
      kind: "supplication";
      /** The Arabic of each section that has any. */
      sections: readonly string[];
      title: string;
      subject: string;
    }
  | { kind: "times"; times: ShareTimes; subject: string };

/**
 * The source for a request: undefined while a Supplication's text loads,
 * null when the request names something that is not bundled.
 */
export const useShareSource = (
  request: ShareRequest | null
): ShareSource | null | undefined => {
  const { t } = useTranslation("share-image");
  const supplicationId = request?.kind === "supplication" ? request.id : null;
  const text = useQuery({
    queryKey: ["share-image", "supplication", supplicationId],
    queryFn: () => loadSupplicationText(supplicationId ?? ""),
    enabled: supplicationId !== null,
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (!request) {
    return null;
  }
  switch (request.kind) {
    case "ayah": {
      const ayah = AYAT.find((item) => item.key === request.ayah);
      const surah = ayah ? SURAHS[ayah.surah - 1] : undefined;
      if (!(ayah && surah)) {
        return null;
      }
      return {
        kind: "ayah",
        text: ayah.text,
        reference: t("reference.ayah", {
          surah: launchLanguage === "ar" ? surah.nameAr : surah.nameEn,
          ayah: formatNumber(ayah.ayah),
        }),
        subject: `ayah ${ayah.key}`,
      };
    }
    case "supplication": {
      const entry = getSupplication(request.id);
      if (!entry || text.isError) {
        return null;
      }
      if (!text.data) {
        return undefined;
      }
      const sections = text.data
        .map((passage) => passage.ar)
        .filter((ar) => ar.length > 0);
      return sections.length === 0
        ? null
        : {
            kind: "supplication",
            sections,
            title: entry.title[launchLanguage],
            subject: request.id,
          };
    }
    case "times": {
      return { kind: "times", times: request.times, subject: "times" };
    }
    default: {
      return request satisfies never;
    }
  }
};
