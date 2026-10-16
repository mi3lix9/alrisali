import "../i18n";
import { occasionsOn } from "@alrisali/domain/shared";
import type { HijriDate } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";
import { launchLanguage } from "@/shared/lib/preferences";
import { WidgetTile } from "@/shared/ui/widget";

import { useOccasions } from "../data/occasions";
import { OccasionList } from "./occasion-list";

const openCalendar = () => router.push("/calendar");

/**
 * Today's Hijri Date and Occasions, for Home; opens the calendar. `compact`
 * is Home's half-width tile: the date over today's Occasions, or the
 * Gregorian date when there are none.
 */
export const HijriTodayCard = ({
  compact = false,
  tonight = null,
}: {
  compact?: boolean;
  /** From Maghrib: the Hijri Date night content follows, noted as the eve. */
  tonight?: HijriDate | null;
}) => {
  const { t } = useTranslation("calendar");
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  const occasions = useOccasions();
  const today = Temporal.Now.plainDateISO();
  const hijri = calendar.toHijri(today);
  const todays = occasionsOn(
    hijri,
    calendar.monthLength(hijri.year, hijri.month),
    occasions
  );

  const eve = tonight
    ? [
        t("today.eve", { date: formatHijriDate(tonight) }),
        ...occasionsOn(
          tonight,
          calendar.monthLength(tonight.year, tonight.month),
          occasions
        ).map((occasion) => occasion.name[launchLanguage]),
      ].join(t("today.separator"))
    : undefined;

  if (compact) {
    return (
      <WidgetTile
        testID="hijri-today-tile"
        label={t("today.title")}
        value={formatHijriDate(hijri)}
        caption={
          eve ??
          (todays.length > 0
            ? todays
                .map((occasion) => occasion.name[launchLanguage])
                .join(t("today.separator"))
            : formatGregorianDate(today))
        }
        onPress={openCalendar}
      />
    );
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>{formatHijriDate(hijri)}</Card.Title>
        <Card.Description>{formatGregorianDate(today)}</Card.Description>
        {eve ? (
          <Card.Description testID="hijri-eve">{eve}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Content>
        <OccasionList occasions={todays} empty={t("today.noOccasions")} />
      </Card.Content>
      <Card.Footer>
        <Button variant="outline" onPress={openCalendar}>
          {t("today.openCalendar")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
