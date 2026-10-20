import "../i18n";
import { DOWNLOAD_KINDS, summarizeStorage } from "@alrisali/domain/shared";
import { Card, Text } from "panelui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useFormatSize } from "@/shared/lib/downloads/format-size";
import { useStoredFiles } from "@/shared/lib/downloads/store";

/** Everything downloaded, and what each kind takes. */
export const StorageSummaryCard = () => {
  const { t } = useTranslation("storage");
  const formatSize = useFormatSize();
  const summary = summarizeStorage(useStoredFiles());

  return (
    <Card>
      <Card.Content className="gap-3">
        <View className="flex-row items-baseline justify-between">
          <Text size="sm" muted>
            {t("total")}
          </Text>
          <Text size="xl" weight="semibold" testID="storage-total">
            {formatSize(summary.bytes)}
          </Text>
        </View>
        <View className="gap-1">
          {DOWNLOAD_KINDS.map((kind) => (
            <View key={kind} className="flex-row justify-between">
              <Text size="sm">{t(`kinds.${kind}`)}</Text>
              <Text size="sm" muted testID={`storage-total-${kind}`}>
                {formatSize(summary.kinds[kind].bytes)}
              </Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};
