import { Input, Item, Text } from "panelui-native";
import { SearchIcon, XIcon } from "panelui-native/icons";
import { useDeferredValue, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

/**
 * A search field's clear button, for its `endContent`. UIKit's own
 * (`clearButtonMode`) sits on the native trailing edge, which is the start of
 * an Arabic field, on top of its search icon.
 */
export const ClearSearchButton = ({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) => {
  const { t } = useTranslation();
  if (query === "") {
    return null;
  }
  return (
    <Pressable
      onPress={onClear}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t("search.clear")}
    >
      <XIcon size={16} />
    </Pressable>
  );
};

/** One thing a search found, opening it when pressed. */
export interface SearchResult {
  key: string;
  title: string;
  /** A second line: where it is, or the passage it was found in. */
  description?: string | undefined;
  testID: string;
  open: () => void;
}

/** A feature's share of the results, under its own heading. */
export interface SearchSection {
  id: string;
  title: string;
  results: SearchResult[];
  /** A line under the results: more not listed, or still searching. */
  note?: string | undefined;
}

/** Each feature's results for one query, or a line saying there are none. */
export const SearchResults = ({ sections }: { sections: SearchSection[] }) => {
  const { t } = useTranslation();
  const shown = sections.filter(
    (section) => section.results.length > 0 || section.note
  );

  if (shown.length === 0) {
    return (
      <Text muted size="sm" accessibilityLiveRegion="polite">
        {t("search.noResults")}
      </Text>
    );
  }
  return shown.map((section) => (
    <View key={section.id} testID={`search-section-${section.id}`}>
      <Text weight="semibold" accessibilityRole="header">
        {section.title}
      </Text>
      <Item.Group>
        {section.results.map(({ key, title, description, testID, open }) => (
          <Item
            key={key}
            size="sm"
            accessibilityRole="button"
            testID={testID}
            onPress={open}
          >
            <Item.Content>
              <Item.Title>{title}</Item.Title>
              {description ? (
                <Item.Description numberOfLines={2}>
                  {description}
                </Item.Description>
              ) : null}
            </Item.Content>
          </Item>
        ))}
      </Item.Group>
      {section.note ? (
        <Text muted size="xs" className="pt-2">
          {section.note}
        </Text>
      ) : null}
    </View>
  ));
};

interface SearchPanelProps {
  /** What can be searched, shown in the empty box. */
  placeholder: string;
  /** The results for a non-empty query, usually `SearchResults`. */
  results: (query: string) => ReactNode;
  /** What the screen shows while nothing is searched. */
  children: ReactNode;
}

/**
 * A search box over a screen: while it holds a query the screen's content
 * gives way to the results each feature finds for it.
 */
export const SearchPanel = ({
  placeholder,
  results,
  children,
}: SearchPanelProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  // Typing stays responsive while the texts are scanned.
  const deferred = useDeferredValue(query).trim();

  return (
    <>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        accessibilityLabel={t("search.label")}
        startContent={<SearchIcon size={18} />}
        endContent={
          <ClearSearchButton query={query} onClear={() => setQuery("")} />
        }
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        testID="search-input"
      />
      {deferred === "" ? children : results(deferred)}
    </>
  );
};
