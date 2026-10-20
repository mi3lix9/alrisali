import { captureException } from "@sentry/react-native";
import { File, Paths } from "expo-file-system";
import { printToFileAsync } from "expo-print";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import { useCallback, useRef, useState } from "react";
import type { ComponentRef, RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";

/** What a mounted canvas `View` hands back as its ref. */
export type CanvasHandle = ComponentRef<typeof View>;

/** How a share ended, for the screen to tell the Believer. */
export type CaptureShareResult = "shared" | "failed";

interface CaptureTarget {
  /** Pixels of the saved image, whatever size the preview is drawn at. */
  width: number;
  height: number;
  fileName: string;
}

const captureAndShare = async (
  canvas: CanvasHandle | null,
  { width, height, fileName }: CaptureTarget
): Promise<CaptureShareResult> => {
  try {
    if (!(canvas && (await isAvailableAsync()))) {
      return "failed";
    }
    const uri = await captureRef(canvas, {
      format: "png",
      quality: 1,
      result: "tmpfile",
      width,
      height,
      fileName,
    });
    await shareAsync(uri, {
      mimeType: "image/png",
      UTI: "public.png",
      dialogTitle: fileName,
    });
    return "shared";
  } catch (error) {
    captureException(error);
    return "failed";
  }
};

/**
 * Captures the mounted canvas to a PNG at the image's own pixels and opens the
 * system share sheet on it. The preview is what is captured, so what the
 * Believer sees is what is sent.
 */
export const useCaptureShare = (): {
  canvasRef: RefObject<CanvasHandle | null>;
  share: (target: CaptureTarget) => Promise<CaptureShareResult>;
  sharing: boolean;
} => {
  const canvasRef = useRef<CanvasHandle | null>(null);
  const [sharing, setSharing] = useState(false);

  const share = useCallback(async (target: CaptureTarget) => {
    setSharing(true);
    const result = await captureAndShare(canvasRef.current, target);
    setSharing(false);
    return result;
  }, []);

  return { canvasRef, share, sharing };
};

/**
 * Prints `html` to a PDF page of `width` by `height` points, named
 * `<fileName>.pdf`, and opens the system share sheet on it.
 */
export const sharePdf = async (
  html: string,
  { width, height, fileName }: CaptureTarget
): Promise<CaptureShareResult> => {
  try {
    if (!(await isAvailableAsync())) {
      return "failed";
    }
    const printed = await printToFileAsync({ html, width, height });
    // The printer names its file at random; the share sheet shows this name.
    const file = new File(Paths.cache, `${fileName}.pdf`);
    await new File(printed.uri).move(file, { overwrite: true });
    await shareAsync(file.uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: fileName,
    });
    return "shared";
  } catch (error) {
    captureException(error);
    return "failed";
  }
};
