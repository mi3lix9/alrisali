import "../i18n";
import { AYAT } from "@alrisali/content/quran";
import type { AyahKey } from "@alrisali/content/quran";
import {
  khatmahStatus,
  lastAyahOnPage,
  portionEndContaining,
} from "@alrisali/domain/khatmah";
import { Button, Card, toast } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useToday } from "@/shared/lib/today";

import { useMarkKhatmahDoneTill } from "../data/khatmah-progress";
import { useActiveKhatmah } from "../hooks/use-active-khatmah";

/**
 * The ayah sheet's "Mark done till…": ends the reading at this ayah, at the
 * end of its page or of its portion, completing the sessions that covers and
 * keeping what was read of the one it ends inside. Nothing without a
 * Khatmah, or for an ayah already read.
 */
export const MarkDoneTillRow = ({ ayah }: { ayah: AyahKey }) => {
  const { t } = useTranslation("khatmahProgress");
  const today = useToday();
  const active = useActiveKhatmah();
  const { mutateAsync: mark, isPending } = useMarkKhatmahDoneTill();

  const current = active
    ? khatmahStatus(active.khatmah, active.logs, today).current
    : null;
  if (!(active && current)) {
    return null;
  }
  const position = AYAT.findIndex((entry) => entry.key === ayah);
  if (position < AYAT.findIndex((entry) => entry.key === current.from)) {
    return null;
  }

  const page = AYAT[position]?.page;
  const choices = [
    ["page", page === undefined ? undefined : lastAyahOnPage(page)],
    ["ayah", ayah],
    ["portion", portionEndContaining(active.khatmah, active.logs, ayah)],
  ] as const;
  // The same ayah under two names is offered once, under the first.
  const offered = choices.filter(
    (choice, index) =>
      choice[1] !== undefined &&
      choices.findIndex(([, key]) => key === choice[1]) === index
  );

  return (
    <Card testID="khatmah-mark-till">
      <Card.Header>
        <Card.Title>{t("markTill.title")}</Card.Title>
      </Card.Header>
      <Card.Footer className="flex-col gap-2">
        {offered.map(([kind, till]) =>
          till ? (
            <Button
              key={kind}
              testID={`khatmah-mark-till-${kind}`}
              variant="secondary"
              disabled={isPending}
              onPress={async () => {
                try {
                  await mark({
                    khatmah: active.khatmah,
                    logs: active.logs,
                    till,
                    today,
                  });
                  toast.show({
                    variant: "success",
                    label: t("markTill.done"),
                  });
                } catch {
                  toast.show({
                    variant: "warning",
                    label: t("markTill.error"),
                  });
                }
              }}
            >
              {t(`markTill.${kind}`)}
            </Button>
          ) : null
        )}
      </Card.Footer>
    </Card>
  );
};
