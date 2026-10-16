import { upcomingGatherings } from "@alrisali/domain/gatherings";
import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { Card } from "panelui-native";
import { Temporal } from "temporal-polyfill";

import { useFormatDay } from "../hooks/use-format-day";
import { groupByDate } from "../utils/group-by-date";
import { EmptyNotice } from "./empty-notice";
import { GatheringList } from "./gathering-list";

/** Upcoming Gatherings, a card per date. */
export const ListView = ({
  gatherings,
  speakers,
  today,
  empty,
}: {
  gatherings: readonly Gathering[];
  speakers: ReadonlyMap<string, Speaker>;
  today: Temporal.PlainDate;
  empty: string;
}) => {
  const formatDay = useFormatDay();
  const groups = groupByDate(upcomingGatherings(gatherings, today));

  if (groups.length === 0) {
    return <EmptyNotice title={empty} />;
  }

  return (
    <>
      {groups.map(({ date, gatherings: onDate }) => {
        const day = formatDay(Temporal.PlainDate.from(date));
        return (
          <Card key={date}>
            <Card.Header>
              <Card.Title>{day.gregorian}</Card.Title>
              <Card.Description>{day.hijri}</Card.Description>
            </Card.Header>
            <Card.Content>
              <GatheringList gatherings={onDate} speakers={speakers} empty="" />
            </Card.Content>
          </Card>
        );
      })}
    </>
  );
};
