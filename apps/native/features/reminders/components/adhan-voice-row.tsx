import "../i18n";
import type { AdhanCatalogueEntry } from "@alrisali/domain/shared";
import { Button, Item, Progress } from "panelui-native";
import {
  CheckIcon,
  DownloadIcon,
  PauseIcon,
  PlayIcon,
} from "panelui-native/icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useFormatSize } from "@/shared/lib/downloads/format-size";
import {
  pauseDownload,
  resumeDownload,
  useDownloadJob,
} from "@/shared/lib/downloads/runner";
import { launchLanguage } from "@/shared/lib/preferences";

import { adhanJobId, downloadAdhan } from "../data/adhan-downloads";
import { useAdhanVoices } from "../hooks/use-adhan-voices";

/**
 * One voice of the adhan catalogue in the editor's Sound section: choosable
 * once it is downloaded, with the download (or its progress, pause and
 * resume) beside it until then. An undownloaded voice cannot be chosen.
 */
export const AdhanVoiceRow = ({
  entry,
  selected,
  onSelect,
}: {
  entry: AdhanCatalogueEntry;
  selected: boolean;
  onSelect: () => void;
}) => {
  const { t } = useTranslation("reminders");
  const formatSize = useFormatSize();
  const { stored, isDownloaded, bytesToDownload } = useAdhanVoices();
  const job = useDownloadJob(adhanJobId(entry.id));
  const downloaded = isDownloaded(entry);
  const name = entry.name[launchLanguage];
  const testID = `adhan-editor-sound-${entry.id}`;
  const running = job?.status === "running";
  const waiting =
    job?.status === "waiting-for-wifi" || job?.status === "offline";
  const stopped = job?.status === "paused" || job?.status === "failed";

  const description = (() => {
    if (downloaded) {
      return t("editor.voiceDownloaded", {
        size: formatSize(entry.full.bytes + entry.takbir.bytes),
      });
    }
    if (!job) {
      return t("editor.voiceNotDownloaded", {
        size: formatSize(bytesToDownload(entry)),
      });
    }
    return [
      t("editor.voiceProgress", { done: job.done, total: job.total }),
      job.status === "running" || job.status === "done"
        ? null
        : t(`editor.voiceStatus.${job.status}`),
    ]
      .filter(Boolean)
      .join(" · ");
  })();

  const action = (() => {
    if (downloaded) {
      return selected ? <CheckIcon size={20} /> : null;
    }
    if (running || waiting) {
      return (
        <Button
          size="icon"
          variant="ghost"
          testID={`${testID}-pause`}
          accessibilityLabel={t("editor.voicePause", { name })}
          onPress={() => pauseDownload(adhanJobId(entry.id))}
        >
          <PauseIcon size={20} />
        </Button>
      );
    }
    return (
      <Button
        size="icon"
        variant="ghost"
        testID={`${testID}-${stopped ? "resume" : "download"}`}
        accessibilityLabel={t(
          stopped ? "editor.voiceResume" : "editor.voiceDownload",
          { name }
        )}
        onPress={() =>
          stopped
            ? resumeDownload(adhanJobId(entry.id))
            : downloadAdhan(entry, stored)
        }
      >
        {stopped ? <PlayIcon size={20} /> : <DownloadIcon size={20} />}
      </Button>
    );
  })();

  return (
    <View>
      <Item
        size="sm"
        testID={testID}
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled: !downloaded }}
        onPress={downloaded ? onSelect : undefined}
      >
        <Item.Content>
          <Item.Title>{name}</Item.Title>
          <Item.Description>{description}</Item.Description>
        </Item.Content>
        <Item.Actions>{action}</Item.Actions>
      </Item>
      {job ? <Progress value={(job.done / job.total) * 100} /> : null}
    </View>
  );
};
