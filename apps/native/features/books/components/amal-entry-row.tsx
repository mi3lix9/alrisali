import "../i18n";
import { getSupplication } from "@alrisali/content/books";
import type { AmalEntry } from "@alrisali/content/books";
import { router } from "expo-router";
import { Badge, Item } from "panelui-native";
import { useTranslation } from "react-i18next";

import { launchLanguage } from "@/shared/lib/preferences";

/** One act of an a'mal day: its Supplication, when it is done, and its kind. */
export const AmalEntryRow = ({ entry }: { entry: AmalEntry }) => {
  const { t } = useTranslation("books");
  const supplication = getSupplication(entry.supplicationId);
  if (!supplication) {
    return null;
  }
  return (
    <Item
      size="sm"
      testID={`amal-entry-${entry.month}-${entry.day}-${entry.supplicationId}`}
      onPress={() =>
        router.push({
          pathname: "/library/supplication/[id]",
          params: { id: supplication.id },
        })
      }
    >
      <Item.Content>
        <Item.Title>{supplication.title[launchLanguage]}</Item.Title>
        {entry.time ? (
          <Item.Description>{t(`amal.times.${entry.time}`)}</Item.Description>
        ) : null}
      </Item.Content>
      <Item.Actions>
        <Badge size="sm" variant="secondary">
          {t(`amal.kinds.${entry.kind}`)}
        </Badge>
      </Item.Actions>
    </Item>
  );
};
