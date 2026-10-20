import "../i18n";
import type { FavoriteItem } from "@alrisali/domain/favorites";
import { HeartIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

import { ActionRow } from "@/shared/ui/action-row";

import { useIsFavorite, useSetFavorite } from "../data/favorites";

/**
 * Favorite as a row of a vertical action list (the ayah sheet's): favourites
 * the item, or removes it from the Favorites once it is there.
 */
export const FavoriteRow = ({ item }: { item: FavoriteItem }) => {
  const { t } = useTranslation("favorites");
  const isFavorite = useIsFavorite(item);
  const setFavorite = useSetFavorite();
  const favorite = isFavorite.data === true;

  return (
    <ActionRow
      testID="favorites-row"
      icon={<HeartIcon size={20} filled={favorite} />}
      label={favorite ? t("saved") : t("add")}
      accessibilityLabel={favorite ? t("remove") : t("add")}
      selected={favorite}
      disabled={isFavorite.isPending || setFavorite.isPending}
      onPress={() => setFavorite.mutate({ item, favorite: !favorite })}
    />
  );
};
