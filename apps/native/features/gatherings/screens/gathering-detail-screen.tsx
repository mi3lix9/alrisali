import "../i18n";
import { localized } from "@alrisali/domain/gatherings";
import { Stack, useLocalSearchParams } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { Badge, Button, Card, Spinner, Text } from "panelui-native";
import { PlayIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { Linking, Platform, View } from "react-native";
import { Temporal } from "temporal-polyfill";

import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import { SpeakerAvatar } from "../components/speaker-avatar";
import { VenueMap } from "../components/venue-map";
import { useGathering } from "../data/gatherings";
import { useFormatDay } from "../hooks/use-format-day";
import { GATHERING_BADGE } from "../utils/gathering-style";
import { mapsUrl } from "../utils/maps-url";
import { formatTimeRange } from "../utils/time";

/** A street-level camera on one venue. */
const VENUE_ZOOM = 15;

/**
 * A Gathering in full: when (both calendars), where (map, directions),
 * who leads it, who may attend, its livestream and description.
 */
export const GatheringDetailScreen = () => {
  const { t } = useTranslation("gatherings");
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending } = useGathering(id);
  const formatDay = useFormatDay();

  // Until the Gathering is read, the header shows the feature's title
  // rather than the route's file name.
  if (isPending || !data) {
    return (
      <>
        <Stack.Screen options={{ title: t("title") }} />
        <Screen>
          {isPending ? <Spinner /> : <Text muted>{t("detail.notFound")}</Text>}
        </Screen>
      </>
    );
  }

  const { gathering, speaker } = data;
  const title = localized(gathering.title, launchLanguage);
  const venueName = localized(gathering.venue.name, launchLanguage);
  const description = localized(gathering.description, launchLanguage);
  const day = formatDay(Temporal.PlainDate.from(gathering.date));
  const { latitude, longitude } = gathering.venue;
  const { livestreamUrl } = gathering;

  return (
    <>
      <Stack.Screen options={{ title }} />
      <Screen>
        <View className="items-start gap-2">
          <Text size="2xl" weight="bold">
            {title}
          </Text>
          <Badge variant={GATHERING_BADGE[gathering.type]}>
            {t(`types.${gathering.type}`)}
          </Badge>
        </View>
        <Card>
          <Card.Header>
            <Card.Description>{t("detail.when")}</Card.Description>
            <Card.Title>{day.gregorian}</Card.Title>
            <Text muted>{day.hijri}</Text>
            <Text>{formatTimeRange(gathering, launchLanguage)}</Text>
          </Card.Header>
          {livestreamUrl ? (
            <Card.Footer>
              <Button
                startContent={<PlayIcon size={16} />}
                onPress={() => openBrowserAsync(livestreamUrl)}
              >
                {t("detail.watchLivestream")}
              </Button>
            </Card.Footer>
          ) : null}
        </Card>
        <Card>
          <Card.Header>
            <Card.Description>{t("detail.venue")}</Card.Description>
            <Card.Title>{venueName}</Card.Title>
            {gathering.venue.address ? (
              <Text muted>{gathering.venue.address}</Text>
            ) : null}
          </Card.Header>
          <Card.Content>
            <VenueMap
              className="h-44"
              interactive={false}
              camera={{
                coordinates: { latitude, longitude },
                zoom: VENUE_ZOOM,
              }}
              pins={[
                { id: gathering.id, title: venueName, latitude, longitude },
              ]}
            />
          </Card.Content>
          <Card.Footer>
            <Button
              variant="outline"
              onPress={() =>
                Linking.openURL(
                  mapsUrl(Platform.OS, { latitude, longitude, name: venueName })
                )
              }
            >
              {t("detail.openInMaps")}
            </Button>
          </Card.Footer>
        </Card>
        {speaker ? (
          <Card>
            <Card.Header>
              <Card.Description>{t("detail.speaker")}</Card.Description>
            </Card.Header>
            <Card.Content>
              <View className="flex-row items-center gap-3">
                <SpeakerAvatar speaker={speaker} size="lg" />
                <Text weight="semibold" className="flex-1">
                  {localized(speaker.name, launchLanguage)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : null}
        <Card>
          <Card.Header>
            <Card.Description>{t("attendance.title")}</Card.Description>
            <Card.Title>{t(`attendance.${gathering.attendance}`)}</Card.Title>
          </Card.Header>
        </Card>
        {description ? (
          <Card>
            <Card.Header>
              <Card.Title>{t("detail.about")}</Card.Title>
            </Card.Header>
            <Card.Content>
              <Text>{description}</Text>
            </Card.Content>
          </Card>
        ) : null}
      </Screen>
    </>
  );
};
