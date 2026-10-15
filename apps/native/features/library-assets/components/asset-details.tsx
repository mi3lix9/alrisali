import type { LibraryAsset } from "@alrisali/domain/library-assets";
import { localized } from "@alrisali/domain/shared";
import { Badge, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { launchLanguage } from "@/shared/lib/preferences";

/** A Library Asset's title, author, kind, category and description. */
export const AssetDetails = ({ asset }: { asset: LibraryAsset }) => {
  const { t } = useTranslation("library-assets");
  const author = localized(asset.author, launchLanguage);
  const description = localized(asset.description, launchLanguage);

  return (
    <View className="gap-2">
      <Text className="text-xl font-bold">
        {localized(asset.title, launchLanguage)}
      </Text>
      {author ? <Text muted>{author}</Text> : null}
      <View className="flex-row gap-2">
        <Badge variant="secondary">{t(`kind.${asset.kind}`)}</Badge>
        <Badge variant="outline">{t(`category.${asset.category}`)}</Badge>
      </View>
      {description ? <Text selectable>{description}</Text> : null}
    </View>
  );
};
