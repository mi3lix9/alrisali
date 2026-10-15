import "../i18n";
import type { Salah } from "@alrisali/domain/shared";
import { Button } from "panelui-native";
import { useTranslation } from "react-i18next";
import type { Temporal } from "temporal-polyfill";

import { useKhushuEntries } from "../data/khushu";
import { useKhushuSheet } from "../hooks/use-khushu-sheet";

interface KhushuButtonProps {
  date: Temporal.PlainDate;
  salah: Salah;
}

/**
 * Shows a logged Salah's Khushu and opens the Khushu sheet to rate, edit or
 * remove it.
 */
export const KhushuButton = ({ date, salah }: KhushuButtonProps) => {
  const { t } = useTranslation("khushu");
  const { data: entries } = useKhushuEntries();
  const open = useKhushuSheet((state) => state.open);
  const saved = entries?.find(
    (entry) => entry.date.equals(date) && entry.salah === salah
  );

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      size="sm"
      onPress={() => open({ date, salah })}
    >
      {saved ? t("rated", { level: saved.level }) : t("rate")}
    </Button>
  );
};
