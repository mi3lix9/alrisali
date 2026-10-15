import "../i18n";
import type { FavoriteItem } from "@alrisali/domain/favorites";
import { Button } from "panelui-native";
import { HeartIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

import { useIsFavorite, useSetFavorite } from "../data/favorites";

/** A heart that favourites the item, or removes it from the Favorites. */
export const FavoriteButton = ({ item }: { item: FavoriteItem }) => {
  const { t } = useTranslation("favorites");
  const isFavorite = useIsFavorite(item);
  const setFavorite = useSetFavorite();
  const favorite = isFavorite.data === true;

  return (
    <Button
      variant="ghost"
      size="icon"
      accessibilityLabel={favorite ? t("remove") : t("add")}
      accessibilityState={{ selected: favorite }}
      disabled={isFavorite.isPending || setFavorite.isPending}
      onPress={() => setFavorite.mutate({ item, favorite: !favorite })}
    >
      <HeartIcon size={22} filled={favorite} />
    </Button>
  );
};
