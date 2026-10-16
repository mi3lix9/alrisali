import "../i18n";
import { FAVORITE_TABS, favoritesInTab } from "@alrisali/domain/favorites";
import type { FavoriteTab } from "@alrisali/domain/favorites";
import { router, Stack } from "expo-router";
import {
  Button,
  Checkbox,
  Item,
  Spinner,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { TrashIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";

import { Screen } from "@/shared/ui/screen";

import { FavoriteEntryContent } from "../components/favorite-entry-content";
import { useRemoveFavorites } from "../data/favorites";
import { useFavoriteEntries } from "../hooks/use-favorite-entries";
import type { ListedFavorite } from "../hooks/use-favorite-entries";

/**
 * Every Favorite, newest first, under All, Quran and Supplications tabs.
 * Select mode picks several and deletes them at once, after the Believer
 * confirms. Library Assets show under All when the route names them
 * (`libraryAssetTitle`).
 */
export const FavoritesScreen = ({
  libraryAssetTitle,
}: {
  libraryAssetTitle?: (id: string) => string | undefined;
}) => {
  const { t } = useTranslation("favorites");
  const { listed, isPending } = useFavoriteEntries(libraryAssetTitle);
  const removeFavorites = useRemoveFavorites();
  const [tab, setTab] = useState<FavoriteTab>("all");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const shown: ListedFavorite[] = favoritesInTab(
    listed.map((row) => ({ ...row, kind: row.favorite.kind })),
    tab
  );
  // Only what the tab shows is deleted; a row removed elsewhere (another
  // device, the heart) is no longer picked.
  const picked = shown.filter((row) => selected.has(row.id));

  const toggleSelecting = () => {
    setSelecting(!selecting);
    setSelected(new Set());
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const confirmDelete = () =>
    Alert.alert(
      t("delete.title", { count: picked.length }),
      t("delete.message"),
      [
        { text: t("delete.cancel"), style: "cancel" },
        {
          text: t("delete.confirm"),
          style: "destructive",
          onPress: () =>
            removeFavorites.mutate(
              picked.map((row) => row.favorite),
              {
                onSuccess: () => {
                  setSelecting(false);
                  setSelected(new Set());
                },
              }
            ),
        },
      ]
    );

  const header = (
    <Stack.Screen
      options={{
        title: t("title"),
        headerRight: () =>
          listed.length > 0 || selecting ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={toggleSelecting}
              testID="favorites-select"
            >
              {selecting ? t("select.cancel") : t("select.start")}
            </Button>
          ) : null,
      }}
    />
  );

  if (isPending) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        {header}
        <Spinner />
      </View>
    );
  }

  return (
    <Screen>
      {header}
      <ToggleButtonGroup
        selectionMode="single"
        size="sm"
        accessibilityLabel={t("tabs.label")}
        value={[tab]}
        onValueChange={([next]) => {
          const chosen = FAVORITE_TABS.find((option) => option === next);
          if (chosen) {
            setTab(chosen);
          }
        }}
      >
        {FAVORITE_TABS.map((option) => (
          <ToggleButton
            key={option}
            id={option}
            testID={`favorites-tab-${option}`}
          >
            {option === "all"
              ? t("tabs.allCount", { count: listed.length })
              : t(`tabs.${option}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {selecting ? (
        <Button
          variant={picked.length > 0 ? "destructive" : "secondary"}
          disabled={picked.length === 0 || removeFavorites.isPending}
          onPress={confirmDelete}
          testID="favorites-delete"
        >
          <TrashIcon size={18} />
          {picked.length > 0
            ? t("delete.button", { count: picked.length })
            : t("delete.pick")}
        </Button>
      ) : null}
      {shown.length === 0 ? (
        <Text muted testID="favorites-empty">
          {listed.length === 0 ? t("empty") : t("emptyTab")}
        </Text>
      ) : (
        <Item.Group>
          {shown.map(({ id, entry }) => (
            <Item
              key={id}
              size="sm"
              testID={`favorites-item-${id}`}
              accessibilityState={
                selecting ? { checked: selected.has(id) } : undefined
              }
              onPress={() => (selecting ? toggle(id) : router.push(entry.href))}
            >
              {selecting ? (
                <Item.Media>
                  <Checkbox
                    checked={selected.has(id)}
                    onCheckedChange={() => toggle(id)}
                  />
                </Item.Media>
              ) : null}
              <FavoriteEntryContent entry={entry} />
            </Item>
          ))}
        </Item.Group>
      )}
    </Screen>
  );
};
