import "../i18n";
import { router } from "expo-router";
import { Button, Card, Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useFavoriteEntries } from "../hooks/use-favorite-entries";
import { FavoriteEntryContent } from "./favorite-entry-content";

/** How many of the newest Favorites the card shows; the screen lists all. */
const SHOWN = 3;

/**
 * The Believer's newest Favorites in the Library, each opening its
 * item, with the way into the Favorites screen. Library Assets are listed
 * when the route names them (`libraryAssetTitle`, undefined for one not on
 * the device).
 */
export const FavoritesCard = ({
  libraryAssetTitle,
}: {
  libraryAssetTitle?: (id: string) => string | undefined;
}) => {
  const { t } = useTranslation("favorites");
  const { listed } = useFavoriteEntries(libraryAssetTitle);
  const shown = listed.slice(0, SHOWN);

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
      </Card.Header>
      <Card.Content className="items-start gap-3">
        {shown.length === 0 ? (
          <Text muted size="sm">
            {t("empty")}
          </Text>
        ) : (
          <Item.Group className="self-stretch">
            {shown.map(({ id, entry }) => (
              <Item key={id} size="sm" onPress={() => router.push(entry.href)}>
                <FavoriteEntryContent entry={entry} />
              </Item>
            ))}
          </Item.Group>
        )}
        <Button
          variant="outline"
          onPress={() => router.push("/library/favorites")}
          testID="favorites-open"
        >
          {t("open")}
        </Button>
      </Card.Content>
    </Card>
  );
};
