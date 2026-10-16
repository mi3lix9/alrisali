import "../i18n";
import { SURAHS } from "@alrisali/content/quran";
import {
  DEFAULT_QURAN_READER_SETTINGS,
  verseOfTheDay,
} from "@alrisali/domain/quran";
import { router } from "expo-router";
import { Button, Card, Direction, Spinner, Text } from "panelui-native";
import { PauseIcon, PlayIcon, RotateCwIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import { formatNumber } from "@/shared/lib/numbers";

import { useQuranReaderSettings } from "../data/reader-settings";
import {
  sendRecitation,
  useRecitationPlayback,
} from "../data/recitation-player";
import { QURAN_FONT, useQuranFont } from "../hooks/use-quran-font";

/**
 * Home's Verse of the Day: today's ayah with its recitation, by the reciter
 * chosen in the reader. Opens the ayah's page without moving the Last-Read
 * Ayah.
 */
export const VerseOfTheDayCard = () => {
  const { t, i18n } = useTranslation("quran");
  const fontLoaded = useQuranFont();
  const settings = useQuranReaderSettings();
  const playback = useRecitationPlayback();
  const ayah = verseOfTheDay(Temporal.Now.plainDateISO());
  const surah = SURAHS[ayah.surah - 1];
  const reciter =
    settings.data?.reciter ?? DEFAULT_QURAN_READER_SETTINGS.reciter;

  const mine =
    playback.status !== "idle" &&
    playback.until === ayah.key &&
    playback.ayah === ayah.key;
  const status = mine ? playback.status : "idle";

  const play = () =>
    sendRecitation({
      type: "play",
      ayah: ayah.key,
      reciter,
      until: ayah.key,
    });
  const listen = (() => {
    switch (status) {
      case "loading": {
        return {
          label: t("verseOfTheDay.pause"),
          icon: <Spinner size="sm" />,
          handlePress: () => sendRecitation({ type: "pause" }),
        };
      }
      case "playing": {
        return {
          label: t("verseOfTheDay.pause"),
          icon: <PauseIcon size={18} />,
          handlePress: () => sendRecitation({ type: "pause" }),
        };
      }
      case "paused": {
        return {
          label: t("verseOfTheDay.play"),
          icon: <PlayIcon size={18} />,
          handlePress: () => sendRecitation({ type: "resume" }),
        };
      }
      case "error": {
        return {
          label: t("recitation.retry"),
          icon: <RotateCwIcon size={18} />,
          handlePress: play,
        };
      }
      default: {
        return {
          label: t("verseOfTheDay.play"),
          icon: <PlayIcon size={18} />,
          handlePress: play,
        };
      }
    }
  })();

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("verseOfTheDay.title")}</Card.Title>
        <Card.Description>
          {t("verseOfTheDay.reference", {
            surah: i18n.language === "ar" ? surah?.nameAr : surah?.nameEn,
            ayah: formatNumber(ayah.ayah),
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
            {ayah.text}
          </Text>
        </Direction>
        {status === "error" ? (
          <Text size="xs" className="text-destructive mt-2">
            {t("recitation.failed")}
          </Text>
        ) : null}
      </Card.Content>
      <Card.Footer className="gap-2">
        <Button
          accessibilityLabel={listen.label}
          startContent={listen.icon}
          onPress={listen.handlePress}
        >
          {listen.label}
        </Button>
        <Button
          variant="outline"
          onPress={() =>
            router.push({
              pathname: "/quran",
              params: { page: String(ayah.page) },
            })
          }
        >
          {t("verseOfTheDay.open")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
