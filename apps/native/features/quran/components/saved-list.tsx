import type {
  AyahKey,
  BookmarkRibbon,
  JumpTarget,
  SavedFilter,
} from "@alrisali/domain/quran";
import { SAVED_FILTERS } from "@alrisali/domain/quran";
import {
  Button,
  Card,
  Item,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { PencilIcon } from "panelui-native/icons";
import { useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useRibbons } from "../data/ribbons";
import { ribbonName, ribbonPlace } from "../utils/ribbons";
import { RibbonRenameSheet } from "./ribbon-rename-sheet";
import { RibbonSwatch } from "./ribbon-swatch";
import { SavedNotes } from "./saved-notes";

/**
 * The Favorites the index's Saved tab lists, drawn by the route: this
 * feature cannot read another's data. It gets a way to open an ayah.
 */
export type SavedFavorites = ComponentType<{
  onSelect: (ayah: AyahKey) => void;
}>;

const RibbonItem = ({
  ribbon,
  onSelect,
  onRename,
}: {
  ribbon: BookmarkRibbon;
  onSelect: (target: JumpTarget) => void;
  onRename: () => void;
}) => {
  const { t, i18n } = useTranslation("quran");
  const name = ribbonName(t, ribbon);
  const place = ribbonPlace(t, i18n.language, ribbon);
  const { ayah } = ribbon;

  return (
    <Item
      size="sm"
      variant="outline"
      testID={`quran-saved-ribbon-${ribbon.color}`}
      {...(ayah
        ? {
            accessibilityRole: "button" as const,
            accessibilityHint: t("ribbons.open"),
            onPress: () => onSelect({ ayah }),
          }
        : {})}
    >
      <Item.Media>
        <RibbonSwatch color={ribbon.color} />
      </Item.Media>
      <Item.Content>
        <Item.Title>{t("ribbons.ribbon", { name })}</Item.Title>
        <Item.Description>{place ?? t("ribbons.unused")}</Item.Description>
      </Item.Content>
      <Item.Actions>
        <Button
          variant="ghost"
          size="icon"
          testID={`quran-saved-ribbon-rename-${ribbon.color}`}
          accessibilityLabel={t("ribbons.rename")}
          onPress={onRename}
        >
          <PencilIcon size={18} />
        </Button>
      </Item.Actions>
    </Item>
  );
};

interface SavedListProps {
  onSelect: (target: JumpTarget) => void;
  /** Present when the route lists Favorites too. */
  favorites?: SavedFavorites | undefined;
  /** Closes the index and shows the reader, for the empty state. */
  onOpenReader?: (() => void) | undefined;
}

/**
 * The Saved tab: the six Bookmark Ribbons and, when the route supplies them,
 * the Favorites. An empty list teaches the long-press.
 */
export const SavedList = ({
  onSelect,
  favorites: Favorites,
  onOpenReader,
}: SavedListProps) => {
  const { t } = useTranslation("quran");
  const ribbons = useRibbons();
  const [filter, setFilter] = useState<SavedFilter>("ribbons");
  const [renaming, setRenaming] = useState<BookmarkRibbon["color"] | null>(
    null
  );
  const filters = SAVED_FILTERS.filter(
    (candidate) => candidate !== "favorites" || Favorites
  );
  const all = ribbons.data ?? [];
  const inUse = all.filter((ribbon) => ribbon.ayah !== null);
  const renamingRibbon = all.find((ribbon) => ribbon.color === renaming);

  return (
    <View className="gap-3" testID="quran-saved">
      {filters.length > 1 ? (
        <ToggleButtonGroup
          selectionMode="single"
          size="sm"
          accessibilityLabel={t("saved.filterLabel")}
          value={[filter]}
          onValueChange={([next]) => {
            const selected = filters.find((candidate) => candidate === next);
            if (selected) {
              setFilter(selected);
            }
          }}
        >
          {filters.map((option) => (
            <ToggleButton
              key={option}
              id={option}
              testID={`quran-saved-filter-${option}`}
            >
              {t(`saved.${option}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      ) : null}
      {filter === "favorites" && Favorites ? (
        <Favorites onSelect={(ayah) => onSelect({ ayah })} />
      ) : null}
      {filter === "notes" ? <SavedNotes onSelect={onSelect} /> : null}
      {filter === "ribbons" || (filter === "favorites" && !Favorites) ? (
        <>
          <Text size="sm" muted>
            {t("ribbons.hint")}
          </Text>
          {inUse.length === 0 ? (
            <Card testID="quran-saved-empty">
              <Card.Content className="items-center gap-2 pt-6">
                <Text weight="semibold">{t("saved.emptyTitle")}</Text>
                <Text size="sm" muted className="text-center">
                  {t("saved.emptyHint")}
                </Text>
                {onOpenReader ? (
                  <Button variant="outline" size="sm" onPress={onOpenReader}>
                    {t("saved.open")}
                  </Button>
                ) : null}
              </Card.Content>
            </Card>
          ) : null}
          {all.map((ribbon) => (
            <RibbonItem
              key={ribbon.color}
              ribbon={ribbon}
              onSelect={onSelect}
              onRename={() => setRenaming(ribbon.color)}
            />
          ))}
        </>
      ) : null}
      <RibbonRenameSheet
        ribbon={renamingRibbon ?? null}
        onClose={() => setRenaming(null)}
      />
    </View>
  );
};
