import "../i18n";
import { Card, Item, Swipe, Text } from "panelui-native";
import { TrashIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useFormatSize } from "@/shared/lib/downloads/format-size";
import { useDownloadJobs } from "@/shared/lib/downloads/runner";
import { launchLanguage } from "@/shared/lib/preferences";

import { deleteAdhan } from "../data/adhan-downloads";
import { useAdhanVoices } from "../hooks/use-adhan-voices";

/**
 * Adhan downloads for the Storage screen: each voice on the device with its
 * size, swiped sideways to delete. Voices are downloaded from an alert's
 * Sound section, where one must be downloaded before it can be chosen.
 */
export const AdhanDownloads = () => {
  const { t } = useTranslation("reminders");
  const formatSize = useFormatSize();
  const { catalogue, stored } = useAdhanVoices();
  const jobs = useDownloadJobs();

  // Voices holding files, or downloading now. One an Admin has since
  // withdrawn is not in the catalogue, but its files are still the Believer's
  // to see and delete.
  const groups = new Map<string, number>();
  for (const file of stored) {
    groups.set(file.group, (groups.get(file.group) ?? 0) + file.bytes);
  }
  for (const job of Object.values(jobs)) {
    if (job.kind === "adhan" && !groups.has(job.group)) {
      groups.set(job.group, 0);
    }
  }

  const nameOf = (id: string) =>
    catalogue.find((entry) => entry.id === id)?.name[launchLanguage] ?? id;

  return (
    <Card testID="storage-adhan">
      <Card.Header>
        <Card.Title>{t("storage.title")}</Card.Title>
        <Card.Description>{t("storage.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-2">
        {groups.size === 0 ? (
          <Text muted>{t("storage.empty")}</Text>
        ) : (
          <Swipe.Group>
            {[...groups].map(([id, bytes]) => (
              <View key={id}>
                <Swipe>
                  <Swipe.End>
                    <Swipe.Action
                      label={t("storage.delete")}
                      color="destructive"
                      icon={<TrashIcon />}
                      onPress={() => deleteAdhan(id)}
                    />
                  </Swipe.End>
                  <Item
                    testID={`storage-adhan-${id}`}
                    accessibilityActions={[
                      { name: "delete", label: t("storage.delete") },
                    ]}
                    onAccessibilityAction={(event) => {
                      if (event.nativeEvent.actionName === "delete") {
                        deleteAdhan(id);
                      }
                    }}
                  >
                    <Item.Content>
                      <Item.Title>{nameOf(id)}</Item.Title>
                      <Item.Description>{formatSize(bytes)}</Item.Description>
                    </Item.Content>
                  </Item>
                </Swipe>
              </View>
            ))}
          </Swipe.Group>
        )}
      </Card.Content>
    </Card>
  );
};
