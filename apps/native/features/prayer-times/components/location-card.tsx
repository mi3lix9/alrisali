import type { Location } from "@alrisali/domain/shared";
import { Button, Card, Input, Item } from "panelui-native";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useChooseLocation,
  useCitySearch,
  useLocateDevice,
} from "../hooks/use-device-location";

const coordinatesText = ({ latitude, longitude }: Location) =>
  `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

/** Where the times are for: from the GPS, or a city the Believer searched. */
export const LocationCard = ({
  location,
  followsDevice,
}: {
  location: Location | null;
  followsDevice: boolean;
}) => {
  const { t } = useTranslation("prayer-times");
  const {
    mutate: locate,
    isPending: locating,
    data: outcome,
  } = useLocateDevice();
  const search = useCitySearch();
  const { choose } = useChooseLocation();
  const [query, setQuery] = useState("");

  const submit = () => {
    if (query.trim() !== "") {
      search.mutate(query);
    }
  };

  let searchMessage: string | null = null;
  if (search.isError) {
    searchMessage = t("location.searchFailed");
  } else if (search.data?.length === 0) {
    searchMessage = t("location.noResults");
  }

  let description = t("location.notSet");
  if (location) {
    description = followsDevice
      ? t("location.following")
      : t("location.chosen");
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>
          {location
            ? (location.name ?? t("location.unnamed"))
            : t("location.title")}
        </Card.Title>
        <Card.Description>
          {location
            ? `${coordinatesText(location)} · ${description}`
            : description}
        </Card.Description>
      </Card.Header>
      <Card.Content className="gap-3">
        <Button variant="outline" onPress={() => locate()} loading={locating}>
          {locating ? t("location.locating") : t("location.useDevice")}
        </Button>
        {outcome === "denied" || outcome === "unavailable" ? (
          <Card.Description>{t(`location.${outcome}`)}</Card.Description>
        ) : null}
        <Input
          label={t("location.search")}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submit}
          returnKeyType="search"
          autoComplete="off"
          autoCorrect={false}
          {...(searchMessage ? { errorMessage: searchMessage } : {})}
        />
        <Button
          variant="secondary"
          onPress={submit}
          loading={search.isPending}
          disabled={query.trim() === ""}
        >
          {search.isPending
            ? t("location.searching")
            : t("location.searchButton")}
        </Button>
        {search.data && search.data.length > 0 ? (
          <Item.Group>
            {search.data.map((result, index) => (
              <Fragment key={coordinatesText(result.location)}>
                {index > 0 && <Item.Separator />}
                <Item
                  size="sm"
                  accessibilityRole="button"
                  onPress={() => {
                    choose(result.location);
                    search.reset();
                    setQuery("");
                  }}
                >
                  <Item.Content>
                    <Item.Title>{result.label}</Item.Title>
                    <Item.Description>
                      {coordinatesText(result.location)}
                    </Item.Description>
                  </Item.Content>
                </Item>
              </Fragment>
            ))}
          </Item.Group>
        ) : null}
      </Card.Content>
    </Card>
  );
};
