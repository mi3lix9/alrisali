import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { Item, Text } from "panelui-native";
import { Fragment } from "react";

import { GatheringItem } from "./gathering-item";

/** Gatherings as rows; `empty` shows when there are none. */
export const GatheringList = ({
  gatherings,
  speakers,
  empty,
  showDate = false,
}: {
  gatherings: readonly Gathering[];
  speakers: ReadonlyMap<string, Speaker>;
  empty: string;
  showDate?: boolean;
}) => {
  if (gatherings.length === 0) {
    return <Text muted>{empty}</Text>;
  }

  return (
    <Item.Group>
      {gatherings.map((gathering, index) => (
        <Fragment key={gathering.id}>
          {index > 0 && <Item.Separator />}
          <GatheringItem
            gathering={gathering}
            speaker={
              gathering.speakerId === null
                ? undefined
                : speakers.get(gathering.speakerId)
            }
            showDate={showDate}
          />
        </Fragment>
      ))}
    </Item.Group>
  );
};
