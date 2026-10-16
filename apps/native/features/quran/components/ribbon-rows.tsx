import "../i18n";
import type { AyahKey } from "@alrisali/domain/quran";
import { Item, Text } from "panelui-native";
import { CheckIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useChangeRibbon, useRibbons } from "../data/ribbons";
import { ribbonName, ribbonPlace } from "../utils/ribbons";
import { RibbonSwatch } from "./ribbon-swatch";

/**
 * The six Bookmark Ribbons as rows of the ayah sheet: choosing a colour
 * moves that ribbon to this ayah; choosing the colour already here takes the
 * ribbon off it.
 */
export const RibbonRows = ({ ayah }: { ayah: AyahKey }) => {
  const { t, i18n } = useTranslation("quran");
  const ribbons = useRibbons();
  const change = useChangeRibbon();

  return (
    <View className="gap-2" testID="ayah-sheet-ribbons">
      <Text size="xs" muted>
        {t("ribbons.hint")}
      </Text>
      {(ribbons.data ?? []).map((ribbon) => {
        const here = ribbon.ayah === ayah;
        const name = ribbonName(t, ribbon);
        const place = here
          ? t("ribbons.hereOn")
          : (ribbonPlace(t, i18n.language, ribbon) ?? t("ribbons.unused"));
        return (
          <Item
            key={ribbon.color}
            size="sm"
            variant="outline"
            accessibilityRole="button"
            accessibilityLabel={
              here
                ? t("ribbons.remove", { name })
                : t("ribbons.place", { name })
            }
            accessibilityState={{ selected: here, disabled: change.isPending }}
            disabled={change.isPending}
            testID={`ayah-sheet-ribbon-${ribbon.color}`}
            onPress={() =>
              change.mutate(
                here
                  ? { type: "clear", color: ribbon.color }
                  : { type: "move", color: ribbon.color, ayah }
              )
            }
          >
            <Item.Media>
              <RibbonSwatch color={ribbon.color} />
            </Item.Media>
            <Item.Content>
              <Item.Title>{t("ribbons.ribbon", { name })}</Item.Title>
              <Item.Description>{place}</Item.Description>
            </Item.Content>
            {here ? (
              <Item.Actions>
                <CheckIcon size={18} />
              </Item.Actions>
            ) : null}
          </Item>
        );
      })}
    </View>
  );
};
