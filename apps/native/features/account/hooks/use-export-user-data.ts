import { readUserTables } from "@alrisali/db-user/shared";
import { exportUserData } from "@alrisali/domain/account";
import { captureException } from "@sentry/react-native";
import { File, Paths } from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { useCallback, useState } from "react";

import { getUserDatabase } from "@/shared/lib/user-database";

/** How an export ended, for the card to tell the Believer. */
export type UserDataExportResult = "shared" | "failed";

/** Writes every table to one JSON file in the cache and shares it. */
const shareUserData = async (): Promise<UserDataExportResult> => {
  try {
    const { db } = await getUserDatabase();
    const exported = exportUserData(await readUserTables(db), new Date());
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

/** Exports everything the Believer recorded as JSON through the share sheet. */
export const useExportUserData = () => {
  const [exporting, setExporting] = useState(false);

  const exportAll = useCallback(async (): Promise<UserDataExportResult> => {
    setExporting(true);
    const result = await shareUserData();
    setExporting(false);
    return result;
  }, []);

  return { exportAll, exporting };
};
