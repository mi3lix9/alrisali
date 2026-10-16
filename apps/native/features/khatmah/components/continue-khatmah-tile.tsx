import "../i18n";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { ContinueTile } from "@/shared/ui/continue-tile";

import { useActiveKhatmah } from "../hooks/use-active-khatmah";
import { useAyahLabel } from "../utils/use-ayah-label";

/**
 * The Khatmah card of Home's Continue row: today's portion, reopening the
 * Khatmah. Hidden without an unfinished Khatmah.
 */
export const ContinueKhatmahTile = () => {
  const { t } = useTranslation("khatmahProgress");
  const { t: tKhatmah } = useTranslation("khatmah");
  const ayahLabel = useAyahLabel();
  const active = useActiveKhatmah();
  const current = active?.status.current;

  if (!(active && current)) {
    return null;
  }
  const { status } = active;
  let standing = tKhatmah("status.onTrack");
  if (status.state === "ahead") {
    standing = tKhatmah("status.ahead", { count: status.sessions });
  } else if (status.state === "behind") {
    standing = tKhatmah("status.behind", { count: status.sessions });
  }

  return (
    <ContinueTile
      testID="khatmah-continue"
      label={t("continue.label")}
      title={tKhatmah("status.portion", {
        from: ayahLabel(current.from),
        to: ayahLabel(current.to),
      })}
      caption={standing}
      onPress={() =>
        router.push({ pathname: "/khatmah", params: { id: active.khatmah.id } })
      }
    />
  );
};
