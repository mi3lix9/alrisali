import "../i18n";
import type { AppLink } from "@alrisali/domain/links";
import { Button } from "panelui-native";
import { LinkIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

import { ActionRow } from "@/shared/ui/action-row";

import { shareLink } from "../utils/share-link";

/** A row of a sheet: shares a link that opens the app at `link` (an ayah). */
export const ShareLinkRow = ({
  link,
  testID,
}: {
  link: AppLink;
  testID: string;
}) => {
  const { t } = useTranslation("links");
  return (
    <ActionRow
      testID={testID}
      icon={<LinkIcon size={20} />}
      label={t("share.link")}
      onPress={() => shareLink(link)}
    />
  );
};

/** A toolbar button: shares a link that opens the app at `link` (a Supplication). */
export const ShareLinkIconButton = ({
  link,
  testID,
}: {
  link: AppLink;
  testID: string;
}) => {
  const { t } = useTranslation("links");
  return (
    <Button
      testID={testID}
      variant="ghost"
      size="icon"
      accessibilityLabel={t("share.link")}
      onPress={() => shareLink(link)}
    >
      <LinkIcon size={22} />
    </Button>
  );
};

/** A labelled button: shares a link that opens the app at `link` (a Khatmah). */
export const ShareLinkButton = ({
  link,
  testID,
}: {
  link: AppLink;
  testID: string;
}) => {
  const { t } = useTranslation("links");
  return (
    <Button testID={testID} variant="outline" onPress={() => shareLink(link)}>
      <LinkIcon size={18} />
      {t("share.link")}
    </Button>
  );
};
