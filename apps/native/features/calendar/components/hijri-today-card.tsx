import "../i18n";
import { occasionsOn } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import {
  formatGregorianDate,
  useFormatHijriDate,
  useHijriCalendar,
} from "@/shared/lib/hijri-calendar";

import { useOccasions } from "../data/occasions";
import { OccasionList } from "./occasion-list";

/** Today's Hijri Date and Occasions, for Home; opens the calendar. */
export const HijriTodayCard = () => {
  const { t } = useTranslation("calendar");
  const calendar = useHijriCalendar();
  const formatHijriDate = useFormatHijriDate();
  const occasions = useOccasions();
  const today = Temporal.Now.plainDateISO();
  const hijri = calendar.toHijri(today);

  return (
    <Card>
      <Card.Header>
        <Card.Title>{formatHijriDate(hijri)}</Card.Title>
        <Card.Description>{formatGregorianDate(today)}</Card.Description>
      </Card.Header>
      <Card.Content>
        <OccasionList
          occasions={occasionsOn(
            hijri,
            calendar.monthLength(hijri.year, hijri.month),
            occasions
          )}
          empty={t("today.noOccasions")}
        />
      </Card.Content>
      <Card.Footer>
        <Button variant="outline" onPress={() => router.push("/calendar")}>
          {t("today.openCalendar")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
