import "../i18n";
import type { AyahKey } from "@alrisali/domain/quran";
import { Button } from "panelui-native";
import { BookmarkIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

import { useReaderLastRead } from "../hooks/reader-last-read";

/**
 * The ayah sheet's "Set as last read": makes the ayah the Last-Read Ayah,
 * overriding where paging or scrolling left it.
 */
export const SetLastReadButton = ({ ayah }: { ayah: AyahKey }) => {
  const { t } = useTranslation("quran");
  const { lastReadAyah, setLastRead } = useReaderLastRead();
  const isLastRead = lastReadAyah === ayah;

  return (
    <Button
      variant="outline"
      accessibilityState={{ selected: isLastRead }}
      disabled={isLastRead}
      startContent={<BookmarkIcon size={18} filled={isLastRead} />}
      onPress={() => setLastRead(ayah)}
    >
      {isLastRead ? t("lastRead.isSet") : t("lastRead.set")}
    </Button>
  );
};
