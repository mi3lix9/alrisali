import { Button } from "panelui-native";
import { PauseIcon, PlayIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

/** Plays or stops the preview of one sound. */
export const SoundPreviewButton = ({
  soundName,
  playing,
  onPress,
  variant = "ghost",
}: {
  /** The sound's name, for the accessibility label. */
  soundName: string;
  playing: boolean;
  onPress: () => void;
  variant?: "ghost" | "secondary";
}) => {
  const { t } = useTranslation("reminders");
  return (
    <Button
      variant={variant}
      size="icon"
      accessibilityLabel={t(playing ? "sheet.stopPreview" : "sheet.preview", {
        sound: soundName,
      })}
      onPress={onPress}
    >
      {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
    </Button>
  );
};
