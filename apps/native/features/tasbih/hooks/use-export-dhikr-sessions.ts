import { exportDhikrSessions } from "@alrisali/domain/tasbih";
import type { DhikrSessionExportFormat } from "@alrisali/domain/tasbih";
import { captureException } from "@sentry/react-native";
import { File, Paths } from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { useCallback, useState } from "react";

import { readDhikrHistory } from "../data/tasbih";

/** How an export ended, for the screen to tell the Believer. */
export type DhikrSessionsExportResult = "shared" | "empty" | "failed";

/** Writes the export to the cache and opens the share sheet on it. */
const shareDhikrSessions = async (
  format: DhikrSessionExportFormat,
  tasbihAlZahraName: string
): Promise<DhikrSessionsExportResult> => {
  try {
    const { sessions, tasbih } = await readDhikrHistory();
    if (sessions.length === 0) {
      return "empty";
    }
    const names = new Map(
      tasbih.map((item) => [
        item.id,
        item.kind === "open" ? item.name : tasbihAlZahraName,
      ])
    );
    const exported = exportDhikrSessions(sessions, names, format);
    const file = new File(Paths.cache, exported.fileName);
    file.create({ overwrite: true });
    await file.write(exported.content);
    if (!(await isAvailableAsync())) {
      return "failed";
    }
    await shareAsync(file.uri, {
      mimeType: exported.mimeType,
      dialogTitle: exported.fileName,
    });
    return "shared";
  } catch (error) {
    captureException(error);
    return "failed";
  }
};

/**
 * Exports every Dhikr Session as CSV or JSON through the share sheet, each
 * named after its Tasbih (`tasbihAlZahraName` for Tasbih al-Zahra).
 */
export const useExportDhikrSessions = (tasbihAlZahraName: string) => {
  const [exporting, setExporting] = useState(false);

  const exportAs = useCallback(
    async (
      format: DhikrSessionExportFormat
    ): Promise<DhikrSessionsExportResult> => {
      setExporting(true);
      const result = await shareDhikrSessions(format, tasbihAlZahraName);
      setExporting(false);
      return result;
    },
    [tasbihAlZahraName]
  );

  return { exportAs, exporting };
};
