import { cameraFor, localized } from "@alrisali/domain/gatherings";
import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { launchLanguage } from "@/shared/lib/preferences";

import { EmptyNotice } from "./empty-notice";
import { GatheringList } from "./gathering-list";
import { VenueMap } from "./venue-map";

/**
 * Every shown Gathering's venue on a map; pressing a pin shows that
 * Gathering below, with a way to its details.
 */
export const MapView = ({
  gatherings,
  speakers,
}: {
  gatherings: readonly Gathering[];
  speakers: ReadonlyMap<string, Speaker>;
}) => {
  const { t } = useTranslation("gatherings");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const camera = cameraFor(gatherings);
  const selected = gatherings.find(({ id }) => id === selectedId);

  if (!camera) {
    return <EmptyNotice title={t("empty.noneOnMap")} />;
  }

  return (
    <>
      <VenueMap
        className="h-96"
        interactive
        camera={camera}
        pins={gatherings.map((gathering) => ({
          id: gathering.id,
          title: localized(gathering.title, launchLanguage),
          latitude: gathering.venue.latitude,
          longitude: gathering.venue.longitude,
        }))}
        onPinPress={setSelectedId}
      />
      {selected ? (
        <Card>
          <Card.Content>
            <GatheringList
              gatherings={[selected]}
              speakers={speakers}
              empty=""
              showDate
            />
          </Card.Content>
          <Card.Footer>
            <Button
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: "/gatherings/[id]",
                  params: { id: selected.id },
                })
              }
            >
              {t("map.openDetails")}
            </Button>
          </Card.Footer>
        </Card>
      ) : null}
    </>
  );
};
