import "../i18n";
import { PRAYER_TIMES } from "@alrisali/domain/shared";
import type { PrayerTimeName } from "@alrisali/domain/shared";
import {
  monthlyTimetable,
  shiftTimetableMonth,
} from "@alrisali/domain/timetable";
import type { TimetableMonth } from "@alrisali/domain/timetable";
import { Stack } from "expo-router";
import {
  Button,
  Card,
  Chip,
  Spinner,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { ChevronLeftIcon, ChevronRightIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
} from "@/shared/lib/hijri-calendar";
import { Screen } from "@/shared/ui/screen";

import { SheetShareButtons } from "../components/sheet-share-buttons";
import { TimetableSheet } from "../components/timetable-sheet";
import { useSheetShare } from "../hooks/use-sheet-share";
import { useSheetWriter } from "../hooks/use-sheet-writer";
import { useTimetablePlace } from "../hooks/use-timetable-place";
import type { TimetableView } from "../hooks/use-timetable-place";
import {
  DEFAULT_COLUMNS,
  monthlySheetRows,
  orderedColumns,
} from "../utils/sheet";
import type { Sheet } from "../utils/sheet";

type Kind = TimetableMonth["kind"];

const MONTH_AND_YEAR = { month: "long", year: "numeric" } as const;
const SHORT_MONTH_AND_YEAR = { month: "short", year: "numeric" } as const;

const isKind = (id: string): id is Kind => id === "gregorian" || id === "hijri";

const MonthlyTimetable = ({ view }: { view: TimetableView }) => {
  const { t } = useTranslation("timetable");
  const { place, placeName, timeFormat } = view;
  const { calendar, timeZone } = place;
  const formatHijriDate = useFormatHijriDate();
  const writer = useSheetWriter(timeFormat);
  const { canvasRef, shareImage, shareDocument, busy } = useSheetShare();
  const [kind, setKind] = useState<Kind>("gregorian");
  const [offset, setOffset] = useState(0);
  const [chosen, setChosen] =
    useState<readonly PrayerTimeName[]>(DEFAULT_COLUMNS);

  const today = Temporal.Now.plainDateISO(timeZone);
  const thisHijri = calendar.toHijri(today);
  const month = shiftTimetableMonth(
    kind === "gregorian"
      ? { kind, year: today.year, month: today.month }
      : { kind, year: thisHijri.year, month: thisHijri.month },
    offset
  );
  const rows = monthlyTimetable(month, place);
  const [first] = rows;
  const last = rows.at(-1);
  if (!(first && last)) {
    return null;
  }

  const columns = orderedColumns(chosen);
  const title =
    month.kind === "gregorian"
      ? formatGregorianDate(first.date, MONTH_AND_YEAR)
      : formatHijriDate({ year: month.year, month: month.month });
  const range =
    month.kind === "gregorian"
      ? [first.hijri, last.hijri]
          .map(({ year, month: hijriMonth }) =>
            formatHijriDate({ year, month: hijriMonth })
          )
          .filter((text, index, all) => all.indexOf(text) === index)
          .join(t("monthly.rangeSeparator"))
      : [first.date, last.date]
          .map((date) => formatGregorianDate(date, SHORT_MONTH_AND_YEAR))
          .filter((text, index, all) => all.indexOf(text) === index)
          .join(t("monthly.rangeSeparator"));
  const sheet: Sheet = {
    title,
    subtitle: placeName
      ? t("monthly.subtitle", { place: placeName, range })
      : range,
    headers: [
      ...(month.kind === "gregorian"
        ? [t("gregorian"), t("hijri")]
        : [t("hijri"), t("gregorian")]),
      ...columns.map((name) => t(`columnNames.${name}`)),
    ],
    rows: monthlySheetRows(month, rows, columns, today, writer),
  };
  const fileName = t("monthly.fileName", {
    month: `${month.year}-${String(month.month).padStart(2, "0")}`,
  });

  const toggle = (name: PrayerTimeName) =>
    setChosen((current) => {
      if (!current.includes(name)) {
        return [...current, name];
      }
      // At least one time stays, or the table would have no times.
      return current.length > 1
        ? current.filter((item) => item !== name)
        : current;
    });

  return (
    <Screen>
      <Stack.Screen options={{ title: t("monthly.title") }} />
      <Card>
        <Card.Header>
          <View className="flex-row items-center justify-between gap-2">
            <Button
              testID="timetable-previous"
              variant="ghost"
              size="icon"
              accessibilityLabel={t("monthly.previous")}
              onPress={() => setOffset(offset - 1)}
            >
              <ChevronLeftIcon size={20} />
            </Button>
            <View className="flex-1 items-center">
              <Card.Title>{title}</Card.Title>
              <Text size="sm" muted>
                {range}
              </Text>
            </View>
            <Button
              testID="timetable-next"
              variant="ghost"
              size="icon"
              accessibilityLabel={t("monthly.next")}
              onPress={() => setOffset(offset + 1)}
            >
              <ChevronRightIcon size={20} />
            </Button>
          </View>
        </Card.Header>
        <Card.Content className="gap-3">
          <ToggleButtonGroup
            testID="timetable-kind"
            selectionMode="single"
            size="sm"
            accessibilityLabel={t("monthly.title")}
            value={[kind]}
            onValueChange={([next]) => {
              if (next && isKind(next) && next !== kind) {
                setKind(next);
                setOffset(0);
              }
            }}
          >
            <ToggleButton id="gregorian">{t("monthly.gregorian")}</ToggleButton>
            <ToggleButton id="hijri">{t("monthly.hijri")}</ToggleButton>
          </ToggleButtonGroup>
          <Text size="sm" muted>
            {t("monthly.columns")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PRAYER_TIMES.map((name) => (
              <Chip
                key={name}
                testID={`timetable-column-${name}`}
                selected={chosen.includes(name)}
                onPress={() => toggle(name)}
              >
                {t(`columnNames.${name}`)}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>
      <TimetableSheet sheet={sheet} wide={2} canvasRef={canvasRef} />
      <SheetShareButtons
        busy={busy}
        onImage={() => shareImage(sheet, fileName)}
        onPdf={() => shareDocument(sheet, fileName)}
      />
    </Screen>
  );
};

/**
 * A month of Prayer Times in one table, Hijri and Gregorian dates side by
 * side, for a Gregorian or a Hijri month, shareable as an image or a PDF.
 */
export const MonthlyTimetableScreen = () => {
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
        <Stack.Screen options={{ title: t("monthly.title") }} />
        <Text muted>{t("noLocation")}</Text>
      </Screen>
    );
  }
  return <MonthlyTimetable view={view} />;
};
