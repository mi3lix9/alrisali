import { localized } from "@alrisali/domain/gatherings";
import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { router } from "expo-router";
import { Badge, Item } from "panelui-native";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import { formatGregorianDate } from "@/shared/lib/hijri-calendar";
import { launchLanguage } from "@/shared/lib/preferences";

import { GATHERING_BADGE } from "../utils/gathering-style";
import { formatTimeRange } from "../utils/time";

const SHORT_DATE: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
};

/**
 * One Gathering in a list: title, (date and) time, venue, Speaker and type;
 * opens its details.
 */
export const GatheringItem = ({
  gathering,
  speaker,
  showDate = false,
}: {
  gathering: Gathering;
  speaker: Speaker | undefined;
  showDate?: boolean;
}) => {
  const { t } = useTranslation("gatherings");
  const time = formatTimeRange(gathering);
  const when = showDate
    ? `${formatGregorianDate(Temporal.PlainDate.from(gathering.date), SHORT_DATE)} · ${time}`
    : time;

  return (
    <Item
      size="sm"
      onPress={() =>
        router.push({
          pathname: "/gatherings/[id]",
          params: { id: gathering.id },
        })
      }
    >
      <Item.Content>
        <Item.Title>{localized(gathering.title, launchLanguage)}</Item.Title>
        <Item.Description>
          {`${when} · ${localized(gathering.venue.name, launchLanguage)}`}
        </Item.Description>
        {speaker ? (
          <Item.Description>
            {localized(speaker.name, launchLanguage)}
          </Item.Description>
        ) : null}
      </Item.Content>
      <Item.Actions>
        <Badge size="sm" variant={GATHERING_BADGE[gathering.type]}>
          {t(`types.${gathering.type}`)}
        </Badge>
      </Item.Actions>
    </Item>
  );
};
