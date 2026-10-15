import type { LibraryAsset } from "@alrisali/domain/library-assets";
import {
  AudioLinesIcon,
  BookIcon,
  FileIcon,
  PlayIcon,
} from "panelui-native/icons";
import { Image, View } from "react-native";

import { libraryFileUrl } from "../data/library-assets";

const KIND_ICON = {
  pdf: FileIcon,
  audio: AudioLinesIcon,
  video: PlayIcon,
  text: BookIcon,
} as const;

/** A Library Asset's cover, or its kind's icon when it has none. */
export const CoverImage = ({
  asset,
  size,
}: {
  asset: LibraryAsset;
  size: number;
}) => {
  if (asset.coverKey) {
    return (
      <Image
        source={{ uri: libraryFileUrl(asset.coverKey) }}
        accessibilityIgnoresInvertColors
        className="bg-muted self-center rounded-lg"
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    );
  }
  const Icon = KIND_ICON[asset.kind];
  return (
    <View
      className="bg-muted items-center justify-center self-center rounded-lg"
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size / 2.5)} />
    </View>
  );
};
