import "../i18n";
import { Button } from "panelui-native";
import { CheckCircleIcon, CheckIcon } from "panelui-native/icons";
import { useTranslation } from "react-i18next";

import { useIsRead, useSetRead } from "../data/reading-completions";
import { useReadingDate } from "../hooks/use-reading-date";

/** Marks a Supplication read today (a Reading Completion), or undoes it. */
export const ReadTodayButton = ({
  supplicationId,
}: {
  supplicationId: string;
}) => {
  const { t } = useTranslation("reading-completion");
  const completion = { supplicationId, date: useReadingDate() };
  const isRead = useIsRead(completion);
  const setRead = useSetRead();
  const read = isRead.data === true;

  return (
    <Button
      variant={read ? "secondary" : "primary"}
      testID="reading-completion-mark"
      accessibilityHint={read ? t("undoHint") : undefined}
      accessibilityState={{ checked: read }}
      disabled={isRead.isPending || setRead.isPending}
      onPress={() => setRead.mutate({ completion, read: !read })}
    >
      {read ? <CheckCircleIcon size={18} /> : <CheckIcon size={18} />}
      {read ? t("read") : t("markRead")}
    </Button>
  );
};
