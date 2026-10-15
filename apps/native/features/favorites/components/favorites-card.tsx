import "../i18n";
import { favoriteId } from "@alrisali/domain/favorites";
import { router } from "expo-router";
import { Card, Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { useFavorites } from "../data/favorites";
import { favoriteEntry } from "../utils/favorite-entry";

/** The Believer's Favorites in the Library, newest first, each opening its item. */
export const FavoritesCard = () => {
  const { t } = useTranslation("favorites");
  const favorites = useFavorites();
  const entries = (favorites.data ?? []).flatMap((favorite) => {
    const entry = favoriteEntry(favorite);
    return entry ? [{ id: favoriteId(favorite), ...entry }] : [];
  });

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
      </Card.Header>
      <Card.Content>
        {entries.length === 0 ? (
          <Text muted size="sm">
            {t("empty")}
          </Text>
        ) : (
          <Item.Group>
            {entries.map((entry) => (
              <Item
                key={entry.id}
                size="sm"
                onPress={() => router.push(entry.href)}
              >
                <Item.Content>
                  <Item.Title>
                    {entry.kind === "ayah"
                      ? t("ayahTitle", {
                          surah: entry.surah,
                          ayah: entry.ayah,
                        })
                      : entry.title}
                  </Item.Title>
                  <Item.Description>{t(`kind.${entry.kind}`)}</Item.Description>
                </Item.Content>
              </Item>
            ))}
          </Item.Group>
        )}
      </Card.Content>
    </Card>
  );
};
