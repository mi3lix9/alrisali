import "../i18n";
import { Item } from "panelui-native";
import { useTranslation } from "react-i18next";

import type { FavoriteEntry } from "../utils/favorite-entry";

/** A Favorite's title and kind, as every Favorites list shows them. */
export const FavoriteEntryContent = ({ entry }: { entry: FavoriteEntry }) => {
  const { t } = useTranslation("favorites");
  return (
    <Item.Content>
      <Item.Title>
        {entry.kind === "ayah"
          ? t("ayahTitle", { surah: entry.surah, ayah: entry.ayah })
          : entry.title}
      </Item.Title>
      <Item.Description>{t(`kind.${entry.kind}`)}</Item.Description>
    </Item.Content>
  );
};
