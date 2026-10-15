import "../i18n";
import { getBook } from "@alrisali/content/books";
import { todaysDailyContent } from "@alrisali/domain/daily-content";
import { router } from "expo-router";
import { Button, Card } from "panelui-native";
import { BookIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { Temporal } from "temporal-polyfill";

import { launchLanguage } from "@/shared/lib/preferences";

import { useDailyContent } from "../data/daily-content";

/**
 * Home's Daily Content: the Supplication Admins feature today, opening it in
 * the reader. Its text is bundled, so it opens offline; hidden on a weekday
 * Admins left empty.
 */
export const DailyContentCard = () => {
  const { t } = useTranslation("dailyContent");
  const entries = useDailyContent();
  const supplication = entries.data
    ? todaysDailyContent(entries.data, Temporal.Now.plainDateISO())
    : undefined;

  if (!supplication) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <Card.Description>{t("title")}</Card.Description>
        <Card.Title>{supplication.title[launchLanguage]}</Card.Title>
        <Card.Description>
          {getBook(supplication.bookId)?.title[launchLanguage]}
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button
          startContent={<BookIcon size={18} />}
          onPress={() =>
            router.push({
              pathname: "/library/supplication/[id]",
              params: { id: supplication.id },
            })
          }
        >
          {t("read")}
        </Button>
      </Card.Footer>
    </Card>
  );
};
