import { localized } from "@alrisali/domain/gatherings";
import type { Speaker } from "@alrisali/domain/gatherings";
import { Avatar } from "panelui-native";
import type { AvatarProps } from "panelui-native";

import { launchLanguage } from "@/shared/lib/preferences";

import { speakerPhotoUrl } from "../data/gatherings";

/** A Speaker's uploaded photo, or the first letter of their name. */
export const SpeakerAvatar = ({
  speaker,
  size = "sm",
}: {
  speaker: Speaker;
  size?: NonNullable<AvatarProps["size"]>;
}) => {
  const name = localized(speaker.name, launchLanguage);
  const photo = speakerPhotoUrl(speaker);
  return (
    <Avatar
      size={size}
      fallback={name.slice(0, 1)}
      accessibilityLabel={name}
      {...(photo ? { source: { uri: photo } } : {})}
    />
  );
};
