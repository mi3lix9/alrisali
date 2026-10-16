import { useCallback, useState } from "react";

import { sharePdf, useCaptureShare } from "@/shared/lib/capture-share";
import type { CaptureShareResult } from "@/shared/lib/capture-share";
import { launchDirection } from "@/shared/lib/i18n";

import { sheetImageSize } from "../utils/sheet";
import type { Sheet } from "../utils/sheet";
import { PDF_PAGE, sheetHtml } from "../utils/sheet-html";

/**
 * Shares a sheet through the system share sheet as an image, of the mounted
 * `canvasRef` view, or as a PDF printed from the same sheet.
 */
export const useSheetShare = () => {
  const { canvasRef, share, sharing } = useCaptureShare();
  const [printing, setPrinting] = useState(false);

  const shareImage = useCallback(
    (sheet: Sheet, fileName: string): Promise<CaptureShareResult> =>
      share({ ...sheetImageSize(sheet.rows.length), fileName }),
    [share]
  );

  const shareDocument = useCallback(
    async (sheet: Sheet, fileName: string): Promise<CaptureShareResult> => {
      setPrinting(true);
      const result = await sharePdf(sheetHtml(sheet, launchDirection), {
        ...PDF_PAGE,
        fileName,
      });
      setPrinting(false);
      return result;
    },
    []
  );

  return { canvasRef, shareImage, shareDocument, busy: sharing || printing };
};
