import { BOOKS } from "@alrisali/content/books";

import "../i18n";
import { router } from "expo-router";
import { Card, Item } from "panelui-native";
import { useTranslation } from "react-i18next";

import { joinParts } from "@/shared/lib/i18n";
import { launchLanguage } from "@/shared/lib/preferences";

/** The Library's list of Books, each opening its contents, then the A'mal. */
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
              testID={`books-book-${book.id}`}
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
                  {joinParts(
                    book.sections.map(
                      (section) => section.title[launchLanguage]
                    )
                  )}
                </Item.Description>
              </Item.Content>
            </Item>
          ))}
          <Item
            size="sm"
            testID="books-amal"
            onPress={() => router.push("/library/amal")}
          >
            <Item.Content>
              <Item.Title>{t("amal.entry")}</Item.Title>
              <Item.Description>{t("amal.entryDescription")}</Item.Description>
            </Item.Content>
          </Item>
        </Item.Group>
      </Card.Content>
    </Card>
  );
};
