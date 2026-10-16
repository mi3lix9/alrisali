import { TASBIH_FEEDBACK_MODES } from "@alrisali/domain/tasbih";
import { Text, ToggleButton, ToggleButtonGroup } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  useTasbihSettings,
  useUpdateTasbihSettings,
} from "../data/tasbih-settings";

/**
 * Sound and haptic, haptic only, or silent: what every Tasbih plays on each
 * tap. Hidden until the Believer's choice is read.
 */
export const FeedbackModePicker = () => {
  const { t } = useTranslation("tasbih");
  const settings = useTasbihSettings();
  const update = useUpdateTasbihSettings();

  if (!settings.data) {
    return null;
  }

  return (
    <View className="gap-2">
      <Text muted size="sm">
        {t("feedback.title")}
      </Text>
      <ToggleButtonGroup
        selectionMode="single"
        size="sm"
        accessibilityLabel={t("feedback.title")}
        value={[settings.data.feedbackMode]}
        onValueChange={([next]) => {
          const feedbackMode = TASBIH_FEEDBACK_MODES.find(
            (candidate) => candidate === next
          );
          if (feedbackMode) {
            update.mutate({ feedbackMode });
          }
        }}
      >
        {TASBIH_FEEDBACK_MODES.map((mode) => (
          <ToggleButton key={mode} id={mode} testID={`tasbih-feedback-${mode}`}>
            {t(`feedback.${mode}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </View>
  );
};
