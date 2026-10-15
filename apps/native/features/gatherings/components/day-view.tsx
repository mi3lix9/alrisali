import { gatheringsOn } from "@alrisali/domain/gatherings";
import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { Card } from "panelui-native";
import { useTranslation } from "react-i18next";
import type { Temporal } from "temporal-polyfill";

import { useFormatDay } from "../hooks/use-format-day";
import { GatheringList } from "./gathering-list";
import { PeriodStepper } from "./period-stepper";

/** One day's Gatherings, stepping a day at a time. */
export const DayView = ({
  gatherings,
  speakers,
  date,
  today,
  onDateChange,
}: {
  gatherings: readonly Gathering[];
  speakers: ReadonlyMap<string, Speaker>;
  date: Temporal.PlainDate;
  today: Temporal.PlainDate;
  onDateChange: (date: Temporal.PlainDate) => void;
}) => {
  const { t } = useTranslation("gatherings");
  const day = useFormatDay()(date);

  return (
    <Card>
      <Card.Header>
        <PeriodStepper
          title={day.gregorian}
          subtitle={day.hijri}
          labels={{
            previous: t("day.previous"),
            next: t("day.next"),
            reset: t("day.today"),
          }}
          onPrevious={() => onDateChange(date.subtract({ days: 1 }))}
          onNext={() => onDateChange(date.add({ days: 1 }))}
          onReset={date.equals(today) ? null : () => onDateChange(today)}
        />
      </Card.Header>
      <Card.Content>
        <GatheringList
          gatherings={gatheringsOn(gatherings, date)}
          speakers={speakers}
          empty={t("empty.noneOnDay")}
        />
      </Card.Content>
    </Card>
  );
};
