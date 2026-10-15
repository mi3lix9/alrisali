import "../i18n";
import { getSupplication, loadSupplicationText } from "@alrisali/content/books";
import type { Passage } from "@alrisali/content/books";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  Button,
  Direction,
  Spinner,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import { MinusIcon, PlusIcon } from "panelui-native/icons";
import { useState } from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";
import { Screen } from "@/shared/ui/screen";

import {
  FONT_SIZE,
  READER_LANGUAGES,
  useReaderPreferences,
} from "../hooks/use-reader-preferences";
import type { ReaderLanguage } from "../hooks/use-reader-preferences";

// English runs smaller than Arabic at the same point size reads.
const ENGLISH_SCALE = 0.75;
const LINE_HEIGHT = 1.8;

const VIEWS = ["read", "recite"] as const;

type ReaderView = (typeof VIEWS)[number];

/** What the route hands the reader to show a text as Recite-Along. */
export interface ReciteAlongSlotProps {
  /** The Arabic text; blank lines separate passages. */
  text: string;
  fontSize: number;
  header: ReactElement;
}

const ReaderControls = ({
  view,
  onViewChange,
}: {
  view: ReaderView;
  /** Offers Recite-Along when given. */
  onViewChange?: ((view: ReaderView) => void) | undefined;
}) => {
  const { t } = useTranslation("books");
  const { language, fontSize, setLanguage, stepFontSize } =
    useReaderPreferences();

  return (
    <View className="flex-row flex-wrap items-center justify-between gap-3 pb-4">
      {onViewChange ? (
        <ToggleButtonGroup
          selectionMode="single"
          size="sm"
          className="w-full"
          accessibilityLabel={t("reader.view.label")}
          value={[view]}
          onValueChange={([next]) => {
            const selected = VIEWS.find((candidate) => candidate === next);
            if (selected) {
              onViewChange(selected);
            }
          }}
        >
          {VIEWS.map((option) => (
            <ToggleButton key={option} id={option}>
              {t(`reader.view.${option}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      ) : null}
      {view === "read" ? (
        <ToggleButtonGroup
          selectionMode="single"
          size="sm"
          accessibilityLabel={t("reader.language.label")}
          value={[language]}
          onValueChange={([next]) => {
            const selected = READER_LANGUAGES.find(
              (candidate) => candidate === next
            );
            if (selected) {
              setLanguage(selected);
            }
          }}
        >
          {READER_LANGUAGES.map((option) => (
            <ToggleButton key={option} id={option}>
              {t(`reader.language.${option}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      ) : (
        <View />
      )}
      <View className="flex-row gap-2">
        <Button
          variant="outline"
          size="icon"
          accessibilityLabel={t("reader.fontSize.smaller")}
          disabled={fontSize <= FONT_SIZE.min}
          onPress={() => stepFontSize(-1)}
        >
          <MinusIcon size={18} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          accessibilityLabel={t("reader.fontSize.larger")}
          disabled={fontSize >= FONT_SIZE.max}
          onPress={() => stepFontSize(1)}
        >
          <PlusIcon size={18} />
        </Button>
      </View>
    </View>
  );
};

const PassageView = ({
  passage,
  language,
  fontSize,
}: {
  passage: Passage;
  language: ReaderLanguage;
  fontSize: number;
}) => {
  const englishSize = Math.round(fontSize * ENGLISH_SCALE);
  const showArabic = language !== "en" && passage.ar.length > 0;
  const showEnglish = language !== "ar" && passage.en !== undefined;

  return (
    <View className="border-border gap-2 border-b py-4">
      {showArabic ? (
        <Direction dir="rtl">
          <Text
            selectable
            style={{ fontSize, lineHeight: fontSize * LINE_HEIGHT }}
          >
            {passage.ar}
          </Text>
        </Direction>
      ) : null}
      {showEnglish ? (
        <Direction dir="ltr">
          <Text
            selectable
            muted={language === "both"}
            style={{
              fontSize: englishSize,
              lineHeight: englishSize * LINE_HEIGHT,
            }}
          >
            {passage.en}
          </Text>
        </Direction>
      ) : null}
    </View>
  );
};

/**
 * Reads one Supplication in Arabic, English or both, at the chosen size, or
 * its Arabic as Recite-Along when the route provides it. A route can add other
 * features' controls for the Supplication: `headerRight` in the header,
 * `footer` after the text.
 */
export const SupplicationReaderScreen = ({
  reciteAlong: ReciteAlong,
  headerRight,
  footer,
}: {
  reciteAlong?: ComponentType<ReciteAlongSlotProps>;
  headerRight?: (supplicationId: string) => ReactNode;
  footer?: (supplicationId: string) => ReactNode;
}) => {
  const { t } = useTranslation("books");
  const { id } = useLocalSearchParams<{ id: string }>();
  const supplication = getSupplication(id);
  const { language, fontSize } = useReaderPreferences();
  const [view, setView] = useState<ReaderView>("read");
  const text = useQuery({
    queryKey: ["books", "supplication-text", id],
    queryFn: () => loadSupplicationText(id),
    enabled: supplication !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (!supplication) {
    return (
      <Screen>
        <Text muted>{t("notFound")}</Text>
      </Screen>
    );
  }

  const controls = (
    <ReaderControls
      view={view}
      onViewChange={ReciteAlong ? setView : undefined}
    />
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: supplication.title[launchLanguage],
          headerLargeTitle: false,
          ...(headerRight && {
            headerRight: () => headerRight(supplication.id),
          }),
        }}
      />
      {ReciteAlong && view === "recite" && text.data ? (
        <ReciteAlong
          text={text.data
            .map((passage) => passage.ar)
            .filter((arabic) => arabic.length > 0)
            .join("\n\n")}
          fontSize={fontSize}
          header={controls}
        />
      ) : (
        <FlatList
          className="bg-background flex-1"
          contentContainerClassName="p-4"
          contentInsetAdjustmentBehavior="automatic"
          data={text.data ?? []}
          keyExtractor={(_, index) => String(index)}
          extraData={`${language}-${fontSize}`}
          ListHeaderComponent={controls}
          ListFooterComponent={
            text.data && footer ? (
              <View className="pt-6 pb-4">{footer(supplication.id)}</View>
            ) : undefined
          }
          ListEmptyComponent={
            text.isError ? (
              <Text muted>{t("reader.loadError")}</Text>
            ) : (
              <Spinner label={t("reader.loading")} />
            )
          }
          renderItem={({ item }) => (
            <PassageView
              passage={item}
              language={language}
              fontSize={fontSize}
            />
          )}
        />
      )}
    </>
  );
};
