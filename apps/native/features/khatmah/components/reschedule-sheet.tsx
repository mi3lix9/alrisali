import "../i18n";
import {
  khatmahSessions,
  reschedule,
  sessionDueDate,
} from "@alrisali/domain/khatmah";
import type { RescheduleMode } from "@alrisali/domain/khatmah";
import { BottomSheet, Button, Text, toast } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { formatNumber } from "@/shared/lib/numbers";
import { useToday } from "@/shared/lib/today";

import { useRescheduleKhatmah } from "../data/khatmah-progress";
import type { ActiveKhatmah } from "../hooks/use-active-khatmah";
import { useDayLabels } from "../utils/use-day-labels";

const MODES: readonly RescheduleMode[] = ["extendEnd", "keepEnd"];

/**
 * Catching up: push the end date back, keeping the portions, or keep it and
 * enlarge the portions still to read. Each choice shows where it leaves the
 * Khatmah before it is made.
 */
export const RescheduleSheet = ({
  active,
  open,
  onClose,
}: {
  active: ActiveKhatmah;
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation("khatmahProgress");
  const today = useToday();
  const dayLabels = useDayLabels();
  const { mutateAsync: apply, isPending } = useRescheduleKhatmah();
  const { khatmah, logs } = active;

  const preview = (mode: RescheduleMode) => {
    const next = reschedule(khatmah, logs, mode, today);
    if (!next) {
      return null;
    }
    const after = { ...khatmah, adjust: next.adjust };
    const left = khatmahSessions(after, logs).filter(
      ({ number }) => number >= next.fromSession
    );
    const pages = left.reduce((sum, { pages: count }) => sum + count, 0);
    return {
      sessions: left.length,
      pagesEach: pages / Math.max(left.length, 1),
      finish: dayLabels(
        sessionDueDate(after, next.fromSession + left.length - 1)
      ),
    };
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <BottomSheet.Content>
        <BottomSheet.Header title={t("reschedule.title")} />
        <BottomSheet.Body className="gap-3 pb-6">
          <Text muted>{t("reschedule.description")}</Text>
          {MODES.map((mode) => {
            const shown = preview(mode);
            return (
              <View key={mode} className="gap-1">
                <Text weight="semibold">{t(`reschedule.${mode}.title`)}</Text>
                <Text size="sm" muted>
                  {t(`reschedule.${mode}.description`)}
                </Text>
                {shown ? (
                  <>
                    <Text size="sm">
                      {t("reschedule.remaining", {
                        n: formatNumber(shown.sessions),
                        pages: formatNumber(shown.pagesEach, {
                          maximumFractionDigits: 1,
                        }),
                      })}
                    </Text>
                    <Text size="sm">
                      {t("reschedule.finish", shown.finish)}
                    </Text>
                  </>
                ) : (
                  <Text size="sm" className="text-destructive">
                    {t("reschedule.unavailable")}
                  </Text>
                )}
                <Button
                  testID={`khatmah-reschedule-${mode}`}
                  variant={mode === "extendEnd" ? "secondary" : "outline"}
                  disabled={isPending || !shown}
                  onPress={async () => {
                    try {
                      await apply({ khatmah, logs, mode, today });
                      toast.show({
                        variant: "success",
                        label: t("reschedule.done"),
                      });
                      onClose();
                    } catch {
                      toast.show({
                        variant: "warning",
                        label: t("reschedule.error"),
                      });
                    }
                  }}
                >
                  {t(`reschedule.${mode}.title`)}
                </Button>
              </View>
            );
          })}
        </BottomSheet.Body>
      </BottomSheet.Content>
    </BottomSheet>
  );
};
