import "../i18n";
import { Button, toast } from "panelui-native";
import { FileIcon, ImageIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { CaptureShareResult } from "@/shared/lib/capture-share";

/** Share as an image or as a PDF; each says when it could not share. */
export const SheetShareButtons = ({
  busy,
  onImage,
  onPdf,
}: {
  busy: boolean;
  onImage: () => Promise<CaptureShareResult>;
  onPdf: () => Promise<CaptureShareResult>;
}) => {
  const { t } = useTranslation("timetable");
  const run = (share: () => Promise<CaptureShareResult>) => async () => {
    if ((await share()) === "failed") {
      toast.show({ variant: "destructive", label: t("share.failed") });
    }
  };
  return (
    <View className="flex-row gap-3">
      <Button
        testID="timetable-share-image"
        className="flex-1"
        variant="secondary"
        disabled={busy}
        onPress={run(onImage)}
      >
        <ImageIcon size={18} />
        {t("share.image")}
      </Button>
      <Button
        testID="timetable-share-pdf"
        className="flex-1"
        variant="secondary"
        disabled={busy}
        onPress={run(onPdf)}
      >
        <FileIcon size={18} />
        {t("share.pdf")}
      </Button>
    </View>
  );
};
