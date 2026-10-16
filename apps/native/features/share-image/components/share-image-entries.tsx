import "../i18n";
import type { AyahKey } from "@alrisali/content/quran";
import type { ShareTimes } from "@alrisali/domain/share-image";
import { useRouter } from "expo-router";
import { Button } from "panelui-native";
import { ImageIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

import { ActionRow } from "@/shared/ui/action-row";

import { shareRequestParams } from "../utils/share-route";
import type { ShareRequest } from "../utils/share-route";

const useOpenComposer = () => {
  const router = useRouter();
  return (request: ShareRequest) =>
    router.push({
      pathname: "/share-image",
      params: shareRequestParams(request),
    });
};

/** A row of the ayah sheet's `share` slot: the ayah as an image. */
export const ShareAyahImageRow = ({ ayah }: { ayah: AyahKey }) => {
  const { t } = useTranslation("share-image");
  const open = useOpenComposer();
  return (
    <ActionRow
      testID="share-image-ayah"
      icon={<ImageIcon size={20} />}
      label={t("action.ayah")}
      onPress={() => open({ kind: "ayah", ayah })}
    />
  );
};

/** A toolbar button of the Supplication reader: an excerpt as an image. */
export const ShareSupplicationImageButton = ({
  supplicationId,
}: {
  supplicationId: string;
}) => {
  const { t } = useTranslation("share-image");
  const open = useOpenComposer();
  return (
    <Button
      testID="share-image-supplication"
      variant="ghost"
      size="icon"
      accessibilityLabel={t("action.supplication")}
      onPress={() => open({ kind: "supplication", id: supplicationId })}
    >
      <ImageIcon size={22} />
    </Button>
  );
};

/** A button for today's Prayer Times, already worded and timed by the caller. */
export const ShareTimesImageButton = ({ times }: { times: ShareTimes }) => {
  const { t } = useTranslation("share-image");
  const open = useOpenComposer();
  return (
    <Button
      testID="share-image-times"
      variant="secondary"
      size="sm"
      onPress={() => open({ kind: "times", times })}
    >
      <ImageIcon size={18} />
      {t("action.times")}
    </Button>
  );
};
