import "../i18n";
import { BOOKS } from "@alrisali/content/books";
import { router } from "expo-router";
import { Card, Item } from "panelui-native";
import { useTranslation } from "react-i18next";

import { launchLanguage } from "@/shared/lib/preferences";

/** The Library's list of Books, each opening its contents. */
export const BooksCard = () => {
  const { t } = useTranslation("books");

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("books")}</Card.Title>
      </Card.Header>
      <Card.Content>
        <Item.Group>
          {BOOKS.map((book) => (
            <Item
              key={book.id}
              size="sm"
              onPress={() =>
                router.push({
                  pathname: "/library/book/[id]",
                  params: { id: book.id },
                })
              }
            >
              <Item.Content>
                <Item.Title>{book.title[launchLanguage]}</Item.Title>
                <Item.Description>
                  {book.sections
                    .map((section) => section.title[launchLanguage])
                    .join(" · ")}
                </Item.Description>
              </Item.Content>
            </Item>
          ))}
        </Item.Group>
      </Card.Content>
    </Card>
  );
};
