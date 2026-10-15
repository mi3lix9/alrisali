import "../i18n";
import { SURAHS } from "@alrisali/content/quran";
import { findAyah } from "@alrisali/domain/quran";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { BookmarkIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

import { useQuranLastRead } from "../data/last-read";
import { formatNumber } from "../utils/format";

/**
 * "Continue reading" for Home and the Library: the surah, ayah and page of
 * the Last-Read Ayah, reopening the reader there in one tap. Before any
 * reading it offers to start at Al-Fatihah.
 */
export const ContinueReadingCard = () => {
  const { t, i18n } = useTranslation("quran");
  const lastRead = useQuranLastRead();
  const ayah = lastRead.data ? findAyah(lastRead.data.ayah) : undefined;
  const surah = ayah ? SURAHS[ayah.surah - 1] : undefined;

  if (lastRead.isPending) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("lastRead.continue")}</Card.Title>
        <Card.Description>
          {ayah && surah
            ? t("lastRead.position", {
                surah: i18n.language === "ar" ? surah.nameAr : surah.nameEn,
                ayah: formatNumber(i18n.language, ayah.ayah),
                page: formatNumber(i18n.language, ayah.page),
              })
            : t("lastRead.empty")}
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button
          startContent={<BookmarkIcon size={18} />}
          onPress={() =>
            router.push({
              pathname: "/quran",
              params: ayah ? { ayah: ayah.key } : { page: "1" },
            })
          }
        >
          {ayah ? t("lastRead.resume") : t("lastRead.start")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
