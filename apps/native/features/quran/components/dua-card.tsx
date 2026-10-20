import "../i18n/duas";
import { SURAHS } from "@alrisali/content/quran";
import { ayatBetween, findAyah } from "@alrisali/domain/quran";
import type { DuaRange } from "@alrisali/domain/quran";
import { router } from "expo-router";
import { Button, Card, Direction, Spinner, Text } from "panelui-native";
import { PauseIcon, PlayIcon, RotateCwIcon } from "panelui-native/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "@/shared/lib/numbers";

import { playQuranicDuas, useRecitingDua } from "../data/quranic-duas";
import {
  sendRecitation,
  useRecitationPlayback,
} from "../data/recitation-player";
import { useDuaReciter } from "../hooks/use-dua-reciter";
import { QURAN_FONT, useQuranFont } from "../hooks/use-quran-font";

interface DuaCardProps {
  dua: DuaRange;
  /** What the card says about the dua: its speaker and subject. */
  title?: ReactNode;
  description?: ReactNode;
}

/** One dua: its ayat from the bundled mushaf, where they are, and a button to hear them. */
export const DuaCard = ({ dua, title, description }: DuaCardProps) => {
  const { t, i18n } = useTranslation("quranDuas");
  const fontLoaded = useQuranFont();
  const reciter = useDuaReciter();
  const playback = useRecitationPlayback();
  const reciting = useRecitingDua();
  const ayat = ayatBetween(dua.from, dua.to);
  const first = findAyah(dua.from);
  const last = findAyah(dua.to);
  const surah = first ? SURAHS[first.surah - 1] : undefined;
  const surahName = i18n.language === "ar" ? surah?.nameAr : surah?.nameEn;

  const status =
    reciting?.id === dua.id && playback.status !== "idle"
      ? playback.status
      : "idle";
  const play = () => playQuranicDuas([dua], reciter);
  const listen = (() => {
    switch (status) {
      case "loading": {
        return {
          label: t("pause"),
          icon: <Spinner size="sm" />,
          handlePress: () => sendRecitation({ type: "pause" }),
        };
      }
      case "playing": {
        return {
          label: t("pause"),
          icon: <PauseIcon size={18} />,
          handlePress: () => sendRecitation({ type: "pause" }),
        };
      }
      case "paused": {
        return {
          label: t("resume"),
          icon: <PlayIcon size={18} />,
          handlePress: () => sendRecitation({ type: "resume" }),
        };
      }
      case "error": {
        return {
          label: t("retry"),
          icon: <RotateCwIcon size={18} />,
          handlePress: play,
        };
      }
      default: {
        return {
          label: t("play"),
          icon: <PlayIcon size={18} />,
          handlePress: play,
        };
      }
    }
  })();

  return (
    <Card testID={`dua-${dua.id}`}>
      <Card.Header>
        {title ? <Card.Title>{title}</Card.Title> : null}
        {description ? (
          <Card.Description>{description}</Card.Description>
        ) : null}
        <Card.Description>
          {first && last && first.key !== last.key
            ? t("referenceRange", {
                surah: surahName,
                from: formatNumber(first.ayah),
                to: formatNumber(last.ayah),
              })
            : t("reference", {
                surah: surahName,
                ayah: formatNumber(first?.ayah ?? 0),
              })}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Direction dir="rtl">
          <Text
            accessibilityLanguage="ar"
            style={
              fontLoaded
                ? { fontFamily: QURAN_FONT, fontSize: 22, lineHeight: 44 }
                : { fontSize: 20, lineHeight: 36 }
            }
          >
            {ayat.map((ayah) => ayah.text).join(" ")}
          </Text>
        </Direction>
        {status === "error" ? (
          <Text size="xs" className="text-destructive mt-2">
            {t("failed")}
          </Text>
        ) : null}
      </Card.Content>
      <Card.Footer className="flex-wrap gap-2">
        <Button
          testID={`dua-play-${dua.id}`}
          accessibilityLabel={t("playLabel")}
          startContent={listen.icon}
          onPress={listen.handlePress}
        >
          {listen.label}
        </Button>
        <Button
          variant="outline"
          onPress={() =>
            router.push({ pathname: "/quran", params: { ayah: dua.from } })
          }
        >
          {t("open")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
