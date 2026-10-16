import { useTranslation } from "react-i18next";

import { formatNumber } from "../numbers";

const KB = 1024;

/** Writes a size in bytes in the interface's language and digits: "12.3 MB", "١٢٫٣ م.ب". */
export const useFormatSize = () => {
  const { t } = useTranslation();
  return (bytes: number): string => {
    let unit: "bytes" | "kb" | "mb" | "gb" = "gb";
    let divisor = KB ** 3;
    if (bytes < KB) {
      unit = "bytes";
      divisor = 1;
    } else if (bytes < KB ** 2) {
      unit = "kb";
      divisor = KB;
    } else if (bytes < KB ** 3) {
      unit = "mb";
      divisor = KB ** 2;
    }
    const value = bytes / divisor;
    return t(`fileSize.${unit}`, {
      value: formatNumber(value, {
        maximumFractionDigits: unit === "bytes" ? 0 : 1,
      }),
      interpolation: { escapeValue: false },
    });
  };
};
