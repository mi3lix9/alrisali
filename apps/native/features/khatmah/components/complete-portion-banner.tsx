import "../i18n";
import type { AyahKey } from "@alrisali/content/quran";
import { completePortionAt } from "@alrisali/domain/khatmah";
import { Button, Card, Text } from "panelui-native";
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
  const { mutate: complete, isPending, isError } = useCompleteKhatmahSession();

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
      <Card.Footer className="flex-col items-stretch gap-2">
        <Button
          testID="khatmah-complete-portion"
          disabled={isPending}
          onPress={() => complete(log)}
        >
          {t("banner.complete")}
        </Button>
        {isError ? (
          <Text size="sm" className="text-destructive">
            {t("banner.error")}
          </Text>
        ) : null}
      </Card.Footer>
    </Card>
  );
};
