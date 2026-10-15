import "../i18n";
import type { AyahKey } from "@alrisali/content/quran";
import {
  firstPageOfSurah,
  openReader,
  pagePosition,
  readerReducer,
  scrubberValue,
} from "@alrisali/domain/quran";
import type {
  JumpTarget,
  QuranReaderSettings,
  ReaderAction,
} from "@alrisali/domain/quran";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Spinner, Text } from "panelui-native";
import { useCallback, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AyahSheet } from "../components/ayah-sheet";
import type { AyahActions } from "../components/ayah-sheet";
import { PageJumpSheet } from "../components/page-jump-sheet";
import { PageMode } from "../components/page-mode";
import { QuranIndexSheet } from "../components/quran-index-sheet";
import { QuranSearchSheet } from "../components/quran-search-sheet";
import { ReaderBottomBar } from "../components/reader-bottom-bar";
import { ReaderSettingsSheet } from "../components/reader-settings-sheet";
import { ReaderTopBar } from "../components/reader-top-bar";
import { SurahMode } from "../components/surah-mode";
import {
  useQuranReaderSettings,
  useUpdateQuranReaderSettings,
} from "../data/reader-settings";
import { useQuranFont } from "../hooks/use-quran-font";
import { useReaderChrome } from "../hooks/use-reader-chrome";
import { useReaderHint } from "../hooks/use-reader-hint";

interface ReaderParams {
  /** `surah:ayah` to open at. */
  ayah?: string;
  page?: string;
  surah?: string;
  [key: string]: string | undefined;
}

const ReaderHint = () => {
  const { t } = useTranslation("quran");
  return (
    <Animated.View
      exiting={FadeOut.duration(200)}
      pointerEvents="none"
      className="absolute inset-x-6 bottom-24 items-center"
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <View className="bg-popover border-border items-center gap-1 rounded-2xl border px-4 py-3 shadow-lg">
        <Text weight="semibold">{t("hint.tap")}</Text>
        <Text size="xs" muted>
          {t("hint.longPress")}
        </Text>
      </View>
    </Animated.View>
  );
};

interface ReaderProps {
  settings: QuranReaderSettings;
  params: ReaderParams;
  width: number;
  height: number;
  ayahActions?: AyahActions | undefined;
}

const Reader = ({
  settings,
  params,
  width,
  height,
  ayahActions,
}: ReaderProps) => {
  const insets = useSafeAreaInsets();
  const update = useUpdateQuranReaderSettings();
  const [state, dispatch] = useReducer(readerReducer, undefined, () =>
    openReader({
      settings,
      ayah: params.ayah ?? null,
      ...(params.page ? { page: Number(params.page) } : {}),
      ...(params.surah ? { surah: Number(params.surah) } : {}),
    })
  );
  const [chrome, send] = useReaderChrome();
  // Bumped by every jump, so the page list or surah remounts at the target.
  const [jumpCount, setJumpCount] = useState(0);
  const hint = useReaderHint();
  const dismissHint = hint.dismiss;

  const onTap = useCallback(() => {
    dismissHint();
    send({ type: "tap" });
  }, [dismissHint, send]);
  const onLongPressAyah = useCallback(
    (ayah: AyahKey) => {
      dismissHint();
      send({ type: "long-press", ayah });
    },
    [dismissHint, send]
  );
  const onScrollStart = useCallback(
    () => send({ type: "scroll-start" }),
    [send]
  );
  const onPageShown = useCallback(
    (page: number) => dispatch({ type: "page-shown", page }),
    []
  );

  /** A jump (scrubber, index, search, page jump) or a return to before one. */
  const move = (action: Extract<ReaderAction, { type: "jump" | "return" }>) => {
    send({ type: "close-sheet" });
    if (readerReducer(state, action) !== state) {
      dispatch(action);
      setJumpCount((count) => count + 1);
    }
  };
  const jumpTo = (to: JumpTarget) => move({ type: "jump", to });
  const openSheet = (kind: "index" | "page-jump" | "search") =>
    send({ type: "open-sheet", sheet: { kind } });
  const closeSheet = () => send({ type: "close-sheet" });

  const changeSettings = (change: Partial<QuranReaderSettings>) => {
    send({ type: "interact" });
    update.mutate(change);
    if (change.mode) {
      dispatch({ type: "switch-mode", mode: change.mode });
    }
    if (change.pageNav) {
      dispatch({ type: "set-page-nav", pageNav: change.pageNav });
    }
  };

  const selectedAyah = chrome.sheet?.kind === "ayah" ? chrome.sheet.ayah : null;
  const position =
    state.mode === "page"
      ? pagePosition(state.currentPage)
      : pagePosition(firstPageOfSurah(state.currentSurah));
  const gestures = { onTap, onLongPressAyah, selectedAyah };

  return (
    <View className="bg-background flex-1 dark:bg-black">
      <StatusBar hidden={!chrome.visible} animated />
      {state.mode === "page" ? (
        <PageMode
          key={jumpCount}
          pageNav={state.pageNav}
          initialPage={state.currentPage}
          width={width}
          height={height}
          insetTop={insets.top}
          insetBottom={insets.bottom}
          onPageShown={onPageShown}
          onScrollStart={onScrollStart}
          {...gestures}
        />
      ) : (
        <SurahMode
          key={jumpCount}
          surah={state.currentSurah}
          fontSize={settings.surahFontSize}
          insetTop={insets.top}
          insetBottom={insets.bottom}
          onNextSurah={() => dispatch({ type: "next-surah" })}
          onScrollStart={onScrollStart}
          {...gestures}
        />
      )}
      {chrome.visible ? (
        <ReaderTopBar
          mode={state.mode}
          position={position}
          surah={state.mode === "page" ? position.surah : state.currentSurah}
          insetTop={insets.top}
          onBack={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          onIndex={() => openSheet("index")}
          onSearch={() => openSheet("search")}
          onSettings={() =>
            send({ type: "open-sheet", sheet: { kind: "settings" } })
          }
        />
      ) : null}
      {chrome.visible ? (
        <ReaderBottomBar
          mode={state.mode}
          value={scrubberValue(state)}
          returnTo={state.returnTo}
          insetBottom={insets.bottom}
          onReturn={() => move({ type: "return" })}
          onScrubberHold={() => send({ type: "scrubber-hold" })}
          onScrubberRelease={() => send({ type: "scrubber-release" })}
          onJump={jumpTo}
        />
      ) : null}
      {hint.shown ? <ReaderHint /> : null}
      <AyahSheet
        ayah={selectedAyah}
        actions={ayahActions}
        onClose={() => send({ type: "close-sheet" })}
      />
      <ReaderSettingsSheet
        open={chrome.sheet?.kind === "settings"}
        settings={{ ...settings, mode: state.mode, pageNav: state.pageNav }}
        onChange={changeSettings}
        onClose={() => send({ type: "close-sheet" })}
      />
      <QuranIndexSheet
        open={chrome.sheet?.kind === "index"}
        current={{ surah: state.currentSurah, juz: position.juz }}
        onSelect={jumpTo}
        onPageJump={() => openSheet("page-jump")}
        onClose={closeSheet}
      />
      <PageJumpSheet
        open={chrome.sheet?.kind === "page-jump"}
        initialPage={state.currentPage}
        onSelect={jumpTo}
        onClose={closeSheet}
      />
      <QuranSearchSheet
        open={chrome.sheet?.kind === "search"}
        onSelect={jumpTo}
        onClose={closeSheet}
      />
    </View>
  );
};

interface QuranReaderScreenProps {
  /** Actions other features add to an ayah's sheet, composed by the route. */
  ayahActions?: AyahActions;
}

/**
 * The full-screen Quran reader: Page Mode or Surah Mode, with no tab bar,
 * header or status bar. A tap shows the controls; a long-press on an ayah
 * opens its sheet.
 */
export const QuranReaderScreen = ({ ayahActions }: QuranReaderScreenProps) => {
  const params = useLocalSearchParams<ReaderParams>();
  const fontLoaded = useQuranFont();
  const settings = useQuranReaderSettings();
  const [size, setSize] = useState<{ width: number; height: number }>();

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) =>
    setSize({
      width: nativeEvent.layout.width,
      height: nativeEvent.layout.height,
    });

  return (
    <View className="bg-background flex-1 dark:bg-black" onLayout={onLayout}>
      <Stack.Screen options={{ headerShown: false }} />
      {fontLoaded && settings.data && size ? (
        <Reader
          settings={settings.data}
          params={params}
          width={size.width}
          height={size.height}
          ayahActions={ayahActions}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Spinner />
        </View>
      )}
    </View>
  );
};
