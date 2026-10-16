import "../i18n";
import { getSupplication } from "@alrisali/content/books";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";
import { launchLanguage } from "@/shared/lib/preferences";
import { ContinueTile } from "@/shared/ui/continue-tile";

import { useLatestSupplicationPosition } from "../data/supplication-positions";

/**
 * The Supplication card of Home's Continue row: the long Supplication the
 * Believer stopped in, reopening it at the saved section. Hidden until they
 * have stopped in one.
 */
export const ContinueSupplicationTile = () => {
  const { t } = useTranslation("books");
  const latest = useLatestSupplicationPosition();
  const supplication = latest.data
    ? getSupplication(latest.data.supplicationId)
    : undefined;

  if (!latest.data || !supplication) {
    return null;
  }

  return (
    <ContinueTile
      testID="books-continue-supplication"
      label={t("continue.label")}
      title={supplication.title[launchLanguage]}
      caption={t("reader.section", {
        number: formatNumber(latest.data.section + 1),
      })}
      onPress={() =>
        router.push({
          pathname: "/library/supplication/[id]",
          params: { id: supplication.id, resume: "1" },
        })
      }
    />
  );
};
