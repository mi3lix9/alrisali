import "../i18n";
import { libraryShelves } from "@alrisali/domain/library-assets";
import { localized } from "@alrisali/domain/shared";
import { router } from "expo-router";
import { Card, Item, Text } from "panelui-native";
import { useTranslation } from "react-i18next";

import { launchLanguage } from "@/shared/lib/preferences";

import { useLibraryAssets } from "../data/library-assets";
import { CoverImage } from "./cover-image";

const THUMBNAIL_SIZE = 40;

/** The Library Assets the Admins published, shelf by shelf, each opening its viewer. */
export const LibraryAssetsCard = () => {
  const { t } = useTranslation("library-assets");
  const assets = useLibraryAssets();
  const shelves = libraryShelves(assets.data ?? []);

  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("title")}</Card.Title>
      </Card.Header>
      <Card.Content className="gap-4">
        {shelves.length === 0 ? (
          <Text muted size="sm">
            {t("empty")}
          </Text>
        ) : (
          shelves.map((shelf) => (
            <Item.Group key={shelf.category}>
              <Text muted size="sm">
                {t(`category.${shelf.category}`)}
              </Text>
              {shelf.assets.map((asset) => {
                const author = localized(asset.author, launchLanguage);
                return (
                  <Item
                    key={asset.id}
                    size="sm"
                    testID={`library-asset-${asset.id}`}
                    onPress={() =>
                      router.push({
                        pathname: "/library/asset/[id]",
                        params: { id: asset.id },
                      })
                    }
                  >
                    <Item.Media>
                      <CoverImage asset={asset} size={THUMBNAIL_SIZE} />
                    </Item.Media>
                    <Item.Content>
                      <Item.Title>
                        {localized(asset.title, launchLanguage)}
                      </Item.Title>
                      <Item.Description>
                        {author
                          ? `${t(`kind.${asset.kind}`)} · ${author}`
                          : t(`kind.${asset.kind}`)}
                      </Item.Description>
                    </Item.Content>
                  </Item>
                );
              })}
            </Item.Group>
          ))
        )}
      </Card.Content>
    </Card>
  );
};
