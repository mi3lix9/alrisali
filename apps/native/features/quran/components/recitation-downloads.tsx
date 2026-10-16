import "../i18n";
import { SURAHS } from "@alrisali/content/quran";
import {
  findReciter,
  juzScopes,
  RECITERS,
  scopeCoverage,
  scopeJobId,
  surahScopes,
} from "@alrisali/domain/quran";
import type { DownloadScope } from "@alrisali/domain/quran";
import {
  Button,
  Card,
  Item,
  Progress,
  Swipe,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "panelui-native";
import {
  CheckIcon,
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from "panelui-native/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

import { useFormatSize } from "@/shared/lib/downloads/format-size";
import {
  pauseDownload,
  resumeDownload,
  useDownloadJobs,
} from "@/shared/lib/downloads/runner";
import { formatNumber } from "@/shared/lib/numbers";

import {
  deleteReciterDownloads,
  downloadRecitation,
  useDownloadedRecitation,
} from "../data/recitation-downloads";
import { ReciterSheet, useReciterName } from "./reciter-sheet";

type ScopeKind = DownloadScope["kind"];

const SCOPE_KINDS: readonly ScopeKind[] = ["surah", "juz", "quran"];

const scopesOf = (kind: ScopeKind): DownloadScope[] => {
  if (kind === "surah") {
    return surahScopes();
  }
  return kind === "juz" ? juzScopes() : [{ kind: "quran" }];
};

const isScopeKind = (value: unknown): value is ScopeKind =>
  SCOPE_KINDS.some((kind) => kind === value);

const ScopeRow = ({
  reciter,
  scope,
  downloaded,
  have,
}: {
  reciter: string;
  scope: DownloadScope;
  downloaded: ReadonlySet<string>;
  have: ReturnType<typeof scopeCoverage>;
}) => {
  const { t } = useTranslation("quran");
  const job = useDownloadJobs()[scopeJobId(reciter, scope)];
  const name = (() => {
    if (scope.kind === "surah") {
      return SURAHS[scope.surah - 1]?.nameAr ?? String(scope.surah);
    }
    return scope.kind === "juz"
      ? t("downloads.juz", { juz: scope.juz })
      : t("downloads.wholeQuran");
  })();
  const id = scopeJobId(reciter, scope);
  const testID = `recitation-download-${id}`;
  const running = job?.status === "running";
  const waiting =
    job?.status === "waiting-for-wifi" || job?.status === "offline";
  const stopped = job?.status === "paused" || job?.status === "failed";

  const action = (() => {
    if (have.complete) {
      return <CheckIcon size={20} />;
    }
    if (running || waiting) {
      return (
        <Button
          size="icon"
          variant="ghost"
          testID={`${testID}-pause`}
          accessibilityLabel={t("downloads.pause", { name })}
          onPress={() => pauseDownload(id)}
        >
          <PauseIcon size={20} />
        </Button>
      );
    }
    return (
      <Button
        size="icon"
        variant="ghost"
        testID={`${testID}-${stopped ? "resume" : "start"}`}
        accessibilityLabel={t(
          stopped ? "downloads.resume" : "downloads.download",
          { name }
        )}
        onPress={() =>
          stopped
            ? resumeDownload(id)
            : downloadRecitation(reciter, scope, downloaded)
        }
      >
        {stopped ? <PlayIcon size={20} /> : <DownloadIcon size={20} />}
      </Button>
    );
  })();

  return (
    <View className="border-border gap-1 border-b py-2" testID={testID}>
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text>{name}</Text>
          <Text size="xs" muted>
            {job
              ? [
                  t("downloads.progress", {
                    done: job.done,
                    total: job.total,
                  }),
                  job.status === "running" || job.status === "done"
                    ? null
                    : t(`downloads.status.${job.status}`),
                ]
                  .filter(Boolean)
                  .join(" · ")
              : t("downloads.ayat", {
                  downloaded: have.downloaded,
                  total: have.total,
                })}
          </Text>
        </View>
        {action}
      </View>
      {job ? <Progress value={(job.done / job.total) * 100} /> : null}
    </View>
  );
};

const ScopePicker = ({
  reciter,
  keys,
}: {
  reciter: string;
  keys: ReadonlySet<string>;
}) => {
  const { t } = useTranslation("quran");
  const [kind, setKind] = useState<ScopeKind>("surah");
  const rows = useMemo(
    () =>
      scopesOf(kind).map((scope) => ({
        scope,
        coverage: scopeCoverage(reciter, scope, keys),
        id: scopeJobId(reciter, scope),
      })),
    [kind, reciter, keys]
  );

  return (
    <View className="gap-2 px-4 pb-3">
      <ToggleButtonGroup
        selectionMode="single"
        size="sm"
        accessibilityLabel={t("downloads.title")}
        value={[kind]}
        onValueChange={([next]) => {
          if (isScopeKind(next)) {
            setKind(next);
          }
        }}
      >
        {SCOPE_KINDS.map((scope) => (
          <ToggleButton key={scope} id={scope}>
            {t(`downloads.scope.${scope}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <ScrollView
        nestedScrollEnabled
        style={{ maxHeight: 360 }}
        testID="recitation-download-scopes"
      >
        {rows.map(({ scope, coverage, id }) => (
          <ScopeRow
            key={id}
            reciter={reciter}
            scope={scope}
            downloaded={keys}
            have={coverage}
          />
        ))}
      </ScrollView>
    </View>
  );
};

/**
 * Recitation downloads for the Storage screen: the reciters with downloads,
 * swiped sideways to delete, each opening to download more by surah, juz or
 * the whole Quran.
 */
export const RecitationDownloads = () => {
  const { t } = useTranslation("quran");
  const nameOf = useReciterName();
  const formatSize = useFormatSize();
  const { keys, bytesByReciter } = useDownloadedRecitation();
  const jobs = useDownloadJobs();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [added, setAdded] = useState<readonly string[]>([]);
  const [choosing, setChoosing] = useState(false);

  const listed = RECITERS.filter(
    (reciter) =>
      bytesByReciter.has(reciter.key) ||
      added.includes(reciter.key) ||
      Object.values(jobs).some(
        (job) => job.kind === "recitation" && job.group === reciter.key
      )
  );

  const countOf = (reciter: string) => {
    let count = 0;
    for (const key of keys) {
      if (key.startsWith(`${reciter}/`)) {
        count += 1;
      }
    }
    return count;
  };

  return (
    <Card testID="storage-recitation">
      <Card.Header>
        <Card.Title>{t("downloads.title")}</Card.Title>
        <Card.Description>{t("downloads.description")}</Card.Description>
      </Card.Header>
      <Card.Content className="gap-2">
        {listed.length === 0 ? (
          <Text muted>{t("downloads.empty")}</Text>
        ) : (
          <Swipe.Group>
            {listed.map((reciter) => {
              const open = expanded === reciter.key;
              const jobIds = Object.values(jobs)
                .filter(
                  (job) =>
                    job.kind === "recitation" && job.group === reciter.key
                )
                .map((job) => job.id);
              return (
                <View key={reciter.key}>
                  <Swipe>
                    <Swipe.End>
                      <Swipe.Action
                        label={t("downloads.delete")}
                        color="destructive"
                        icon={<TrashIcon />}
                        onPress={() => {
                          deleteReciterDownloads(reciter.key, jobIds);
                          setAdded((now) =>
                            now.filter((key) => key !== reciter.key)
                          );
                        }}
                      />
                    </Swipe.End>
                    <Item
                      testID={`storage-reciter-${reciter.key}`}
                      onPress={() => setExpanded(open ? null : reciter.key)}
                    >
                      <Item.Content>
                        <Item.Title>{nameOf(reciter)}</Item.Title>
                        <Item.Description>
                          {t("downloads.ayat", {
                            downloaded: countOf(reciter.key),
                            total: formatNumber(6236),
                          })}
                          {" · "}
                          {formatSize(bytesByReciter.get(reciter.key) ?? 0)}
                        </Item.Description>
                      </Item.Content>
                    </Item>
                  </Swipe>
                  {open ? (
                    <ScopePicker reciter={reciter.key} keys={keys} />
                  ) : null}
                </View>
              );
            })}
          </Swipe.Group>
        )}
        <Button
          variant="outline"
          testID="storage-add-reciter"
          onPress={() => setChoosing(true)}
        >
          <PlusIcon size={18} />
          {t("downloads.addReciter")}
        </Button>
      </Card.Content>
      <ReciterSheet
        open={choosing}
        reciter=""
        start="1:1"
        onSelect={(key) => {
          if (findReciter(key)) {
            setAdded((now) => (now.includes(key) ? now : [...now, key]));
            setExpanded(key);
          }
          setChoosing(false);
        }}
        onClose={() => setChoosing(false)}
      />
    </Card>
  );
};
