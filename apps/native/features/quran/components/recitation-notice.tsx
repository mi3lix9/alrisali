import type { RecitationPlayback } from "@alrisali/domain/quran";
import { Button, Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { sendRecitation } from "../data/recitation-player";

/**
 * "Continue to the next ayat?", shown below the mini player bar when a range
 * ends: yes carries on from the next ayah, no ends recitation.
 */
const ContinuePrompt = () => {
  const { t } = useTranslation("quran");

  return (
    <Card className="mt-2" testID="recitation-continue-prompt">
      <Card.Content className="items-center gap-3">
        <Text weight="semibold">{t("recitation.continuePrompt")}</Text>
        <View className="flex-row gap-2">
          <Button
            testID="recitation-continue-yes"
            onPress={() => sendRecitation({ type: "continue" })}
          >
            {t("recitation.continueYes")}
          </Button>
          <Button
            testID="recitation-continue-no"
            variant="outline"
            onPress={() => sendRecitation({ type: "stop" })}
          >
            {t("recitation.continueNo")}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

/** What the mini player bar says under itself: the continue question, or that audio failed. */
export const RecitationNotice = ({
  playback,
}: {
  playback: RecitationPlayback;
}) => {
  const { t } = useTranslation("quran");
  if (playback.status === "awaiting-continue") {
    return <ContinuePrompt />;
  }
  if (playback.status === "error") {
    return (
      <Text size="xs" className="text-destructive mt-1">
        {t("recitation.failed")}
      </Text>
    );
  }
  return null;
};
