import "../i18n";
import type { AyahKey } from "@alrisali/content/quran";
import { completePortionAt } from "@alrisali/domain/khatmah";
import { Button, Card, toast } from "panelui-native";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";

import { useCompleteKhatmahSession } from "../data/khatmah";
import { useActiveKhatmah } from "../hooks/use-active-khatmah";

/**
 * The ayah sheet's banner for the ayah where today's Khatmah portion ends:
 * "Complete today's portion". Nothing on any other ayah, or without a
 * Khatmah to read.
 */
export const CompletePortionBanner = ({ ayah }: { ayah: AyahKey }) => {
  const { t } = useTranslation("khatmah");
  const today = useToday();
  const active = useActiveKhatmah();
  const { mutateAsync: complete, isPending } = useCompleteKhatmahSession();

  const log = active
    ? completePortionAt(active.khatmah, active.logs, ayah, today)
    : null;
  if (!(active && log)) {
    return null;
  }

  return (
    <Card testID="khatmah-banner">
      <Card.Header>
        <Card.Title>{t("banner.title")}</Card.Title>
        <Card.Description>
          {t("banner.description", {
            n: formatNumber(log.session),
            total: formatNumber(active.status.total),
          })}
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button
          testID="khatmah-complete-portion"
          disabled={isPending}
          onPress={async () => {
            // The banner leaves as soon as the portion counts as done, so the
            // outcome is told in a toast.
            try {
              await complete(log);
              toast.show({ variant: "success", label: t("banner.completed") });
            } catch {
              toast.show({ variant: "warning", label: t("banner.error") });
            }
          }}
        >
          {t("banner.complete")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
