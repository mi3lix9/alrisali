import "../i18n";
import {
  LAYLAT_AL_QADR_NIGHTS,
  RAMADAN,
  ramadanImsakiyya,
} from "@alrisali/domain/timetable";
import { Stack } from "expo-router";
import { Card, Spinner, Text } from "panelui-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { Screen } from "@/shared/ui/screen";

import { SheetShareButtons } from "../components/sheet-share-buttons";
import { TimetableSheet } from "../components/timetable-sheet";
import { useSheetShare } from "../hooks/use-sheet-share";
import { useSheetWriter } from "../hooks/use-sheet-writer";
import { useTimetablePlace } from "../hooks/use-timetable-place";
import type { TimetableView } from "../hooks/use-timetable-place";
import { imsakiyyaSheetRows } from "../utils/sheet";
import type { Sheet } from "../utils/sheet";

const Imsakiyya = ({ view }: { view: TimetableView }) => {
  const { t } = useTranslation("timetable");
  const { place, placeName, timeFormat } = view;
  const writer = useSheetWriter(timeFormat);
  const { canvasRef, shareImage, shareDocument, busy } = useSheetShare();

  const today = Temporal.Now.plainDateISO(place.timeZone);
  const { year, month } = place.calendar.toHijri(today);
  // After Ramadan the next one is the one to plan.
  const ramadanYear = month > RAMADAN ? year + 1 : year;
  const rows = useMemo(
    () => ramadanImsakiyya(ramadanYear, place),
    [ramadanYear, place]
  );
  const shown = rows.find(({ date }) => date.equals(today)) ?? rows[0];
  if (!shown) {
    return null;
  }

  const sheet: Sheet = {
    title: t("imsakiyya.title"),
    subtitle: placeName
      ? t("imsakiyya.subtitleWithPlace", {
          place: placeName,
          year: ramadanYear,
        })
      : t("imsakiyya.subtitle", { year: ramadanYear }),
    headers: [
      t("day"),
      t("date"),
      t("columnNames.imsak"),
      t("columnNames.fajr"),
      t("columnNames.dhuhr"),
      t("iftar"),
    ],
    rows: imsakiyyaSheetRows(rows, today, writer, t("imsakiyya.qadrTag")),
  };
  const fileName = t("imsakiyya.fileName", { year: ramadanYear });
  const [first, second, third] = LAYLAT_AL_QADR_NIGHTS;

  return (
    <Screen>
      <Stack.Screen options={{ title: t("imsakiyya.title") }} />
      <Card testID="imsakiyya-today">
        <Card.Header>
          <Card.Title>
            {shown.date.equals(today)
              ? t("imsakiyya.heroDay", { day: shown.day })
              : t("imsakiyya.heroFirst")}
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <View className="flex-row justify-between gap-4">
            <View className="flex-1">
              <Text size="sm" muted>
                {t("imsakiyya.imsak")}
              </Text>
              <Text size="2xl" weight="bold" testID="imsakiyya-imsak">
                {writer.time(shown.imsak)}
              </Text>
            </View>
            <View className="flex-1">
              <Text size="sm" muted>
                {t("imsakiyya.iftar")}
              </Text>
              <Text size="2xl" weight="bold" testID="imsakiyya-iftar">
                {writer.time(shown.iftar)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      <TimetableSheet sheet={sheet} wide={2} canvasRef={canvasRef} />
      <Text size="sm" muted>
        {t("imsakiyya.qadrNote", { first, second, third })}
      </Text>
      <SheetShareButtons
        busy={busy}
        onImage={() => shareImage(sheet, fileName)}
        onPdf={() => shareDocument(sheet, fileName)}
      />
    </Screen>
  );
};

/**
 * The Ramadan Imsakiyya: today's Imsak and Iftar over the whole month with
 * its Laylat al-Qadr nights marked, shareable as an image or a PDF. The
 * Feature Registry shows it only around Ramadan.
 */
export const ImsakiyyaScreen = () => {
  const { t } = useTranslation("timetable");
  const view = useTimetablePlace();
  if (view === undefined) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    );
  }
  if (view === null) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t("imsakiyya.title") }} />
        <Text muted>{t("noLocation")}</Text>
      </Screen>
    );
  }
  return <Imsakiyya view={view} />;
};
