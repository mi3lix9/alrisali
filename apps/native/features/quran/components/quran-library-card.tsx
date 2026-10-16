import "../i18n";
import { PAGE_COUNT } from "@alrisali/domain/quran";
import type { JumpTarget } from "@alrisali/domain/quran";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { FileIcon, ListIcon, SearchIcon } from "panelui-native/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PageJumpSheet } from "./page-jump-sheet";
import { QuranIndexSheet } from "./quran-index-sheet";
import { QuranSearchSheet } from "./quran-search-sheet";

type LibrarySheet = "index" | "page-jump" | "search";

/** Opens the reader where a Library index, page jump or search points. */
const openReaderAt = (target: JumpTarget) => {
  if ("page" in target) {
    router.push({ pathname: "/quran", params: { page: String(target.page) } });
  } else if ("surah" in target) {
    router.push({
      pathname: "/quran",
      params: { surah: String(target.surah) },
    });
  } else {
    router.push({ pathname: "/quran", params: { ayah: target.ayah } });
  }
};

/**
 * The Quran's entry in the Library: opens Page Mode at page 1, or at a Surah,
 * Juz, page or search result.
 */
export const QuranLibraryCard = () => {
  const { t } = useTranslation("quran");
  const [sheet, setSheet] = useState<LibrarySheet | null>(null);
  const select = (target: JumpTarget) => {
    setSheet(null);
    openReaderAt(target);
  };
  const close = () => setSheet(null);

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
        <Card.Description>
          {t("library.description", { pages: PAGE_COUNT })}
        </Card.Description>
      </Card.Header>
      <Card.Footer className="flex-row flex-wrap gap-2">
        <Button
          onPress={() =>
            router.push({ pathname: "/quran", params: { page: "1" } })
          }
        >
          {t("library.open")}
        </Button>
        <Button
          variant="outline"
          startContent={<ListIcon size={18} />}
          onPress={() => setSheet("index")}
        >
          {t("navigation.index")}
        </Button>
        <Button
          variant="outline"
          startContent={<FileIcon size={18} />}
          onPress={() => setSheet("page-jump")}
        >
          {t("navigation.pageJump")}
        </Button>
        <Button
          variant="outline"
          startContent={<SearchIcon size={18} />}
          onPress={() => setSheet("search")}
        >
          {t("navigation.search")}
        </Button>
      </Card.Footer>
      <QuranIndexSheet
        open={sheet === "index"}
        onSelect={select}
        onPageJump={() => setSheet("page-jump")}
        onClose={close}
      />
      <PageJumpSheet
        open={sheet === "page-jump"}
        initialPage={1}
        onSelect={select}
        onClose={close}
      />
      <QuranSearchSheet
        open={sheet === "search"}
        onSelect={select}
        onClose={close}
      />
    </Card>
  );
};
