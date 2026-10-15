import "../i18n";
import { getBook } from "@alrisali/content/books";
import type { SupplicationSummary } from "@alrisali/content/books";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { SectionList, View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

const SupplicationRow = ({ item }: { item: SupplicationSummary }) => (
  <Item
    size="sm"
    onPress={() =>
      router.push({
        pathname: "/library/supplication/[id]",
        params: { id: item.id },
      })
    }
  >
    {item.number === undefined ? null : (
      <Item.Media>
        <Text muted size="sm">
          {item.number.toLocaleString(launchLanguage)}
        </Text>
      </Item.Media>
    )}
    <Item.Content>
      <Item.Title>{item.title[launchLanguage]}</Item.Title>
    </Item.Content>
  </Item>
);

/** A Book's contents: its sections and their Supplications. */
export const BookScreen = () => {
  const { t } = useTranslation("books");
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = getBook(id);

  if (!book) {
    return (
      <Screen>
        <Text muted>{t("notFound")}</Text>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: book.title[launchLanguage] }} />
      <SectionList
        className="bg-background flex-1"
        contentContainerClassName="p-4"
        contentInsetAdjustmentBehavior="automatic"
        sections={book.sections.map((section) => ({
          key: section.id,
          title: section.title[launchLanguage],
          data: section.supplications,
        }))}
        keyExtractor={(item) => item.id}
        renderItem={SupplicationRow}
        renderSectionHeader={({ section }) => (
          <View className="bg-background pt-4 pb-2">
            <Text weight="semibold" size="lg">
              {section.title}
            </Text>
          </View>
        )}
      />
    </>
  );
};
