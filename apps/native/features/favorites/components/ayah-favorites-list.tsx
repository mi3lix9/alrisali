import "../i18n";
import type { AyahKey } from "@alrisali/content/quran";
import { Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useFavoriteEntries } from "../hooks/use-favorite-entries";
import { FavoriteEntryContent } from "./favorite-entry-content";

/**
 * The favorite ayat, newest first, each opening where `onSelect` takes it.
 * The Quran index lists them under Saved; an empty list teaches the
 * long-press.
 */
export const AyahFavoritesList = ({
  onSelect,
}: {
  onSelect: (ayah: AyahKey) => void;
}) => {
  const { t } = useTranslation("favorites");
  const { listed } = useFavoriteEntries();
  const ayat = listed.filter(({ entry }) => entry.kind === "ayah");

  if (ayat.length === 0) {
    return (
      <Text size="sm" muted testID="quran-saved-favorites-empty">
        {t("ayahEmpty")}
      </Text>
    );
  }

  return (
    <View className="gap-2" testID="quran-saved-favorites">
      {ayat.map(({ id, favorite, entry }) => (
        <Item
          key={id}
          size="sm"
          variant="outline"
          accessibilityRole="button"
          onPress={() => onSelect(favorite.key as AyahKey)}
        >
          <FavoriteEntryContent entry={entry} />
        </Item>
      ))}
    </View>
  );
};
