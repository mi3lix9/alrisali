import {
  AT_TIME_ALERTS,
  IMSAK_AT_TIME_ALERTS,
  isFullAdhanAvailable,
} from "@alrisali/domain/reminders";
import type {
  AtTimeAlert,
  ImsakRule,
  ReminderRule,
} from "@alrisali/domain/reminders";
import { Item, Switch } from "panelui-native";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { useAdhanVoices } from "../hooks/use-adhan-voices";
import type { ReminderKey } from "../utils/reminder-key";
import { Choice } from "./choice";
import { AtTimeIcon } from "./reminder-row";

/**
 * What happens at the Prayer Time: off, silent, the takbir or the full
 * adhan. The full adhan is offered but disabled, with the reason, until an
 * adhan voice is downloaded; Imsak has none, and may come only in Ramadan.
 */
export const AtTimePage = ({
  reminderKey,
  rule,
  ramadanOnly,
  onChange,
  onRamadanOnlyChange,
}: {
  reminderKey: ReminderKey;
  rule: ReminderRule;
  /** Imsak's Ramadan-only choice. */
  ramadanOnly: ImsakRule["ramadanOnly"] | undefined;
  onChange: (change: { atTime: AtTimeAlert }) => void;
  onRamadanOnlyChange: (ramadanOnly: boolean) => void;
}) => {
  const { t } = useTranslation("reminders");
  const { installed } = useAdhanVoices();
  const fullAdhanAvailable = isFullAdhanAvailable(installed);
  const imsak = reminderKey === "imsak";
  const kinds: readonly AtTimeAlert[] = imsak
    ? IMSAK_AT_TIME_ALERTS
    : AT_TIME_ALERTS;

  const describe = (kind: AtTimeAlert) => {
    if (kind !== "adhan") {
      return t(`atTime.${kind}.description`);
    }
    if (!fullAdhanAvailable) {
      return t("editor.adhanUnavailable");
    }
    return Platform.OS === "ios"
      ? `${t("atTime.adhan.description")} · ${t("editor.adhanOnOpen")}`
      : t("atTime.adhan.description");
  };

  return (
    <>
      <Item.Group>
        {kinds.map((kind, index) => (
          <Fragment key={kind}>
            {index > 0 ? <Item.Separator /> : null}
            <Choice
              testID={`adhan-editor-at-time-${kind}`}
              title={t(`atTime.${kind}.title`)}
              description={describe(kind)}
              selected={rule.atTime === kind}
              disabled={kind === "adhan" && !fullAdhanAvailable}
              start={<AtTimeIcon atTime={kind} />}
              onPress={() => onChange({ atTime: kind })}
            />
          </Fragment>
        ))}
      </Item.Group>
      {imsak ? (
        <Item.Group>
          <Item size="sm">
            <Item.Content>
              <Item.Title>{t("editor.ramadanOnly")}</Item.Title>
              <Item.Description>{t("editor.ramadanOnlyHint")}</Item.Description>
            </Item.Content>
            <Item.Actions>
              <Switch
                label={t("editor.ramadanOnly")}
                value={ramadanOnly ?? true}
                onValueChange={onRamadanOnlyChange}
              />
            </Item.Actions>
          </Item>
        </Item.Group>
      ) : null}
    </>
  );
};
