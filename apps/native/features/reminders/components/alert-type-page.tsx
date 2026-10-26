import {
  ALERT_TYPES,
  alertTypeOf,
  ruleChangeForAlertType,
} from "@alrisali/domain/reminders";
import type { ReminderRule } from "@alrisali/domain/reminders";
import { Item } from "panelui-native";
import { CheckIcon } from "panelui-native/icons";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useCSSVariable } from "uniwind";

import { AlertTypeIcon } from "./alert-type-icon";

/** The four alert types, each with what it does; the chosen one is ticked. */
export const AlertTypePage = ({
  rule,
  onChange,
}: {
  rule: ReminderRule;
  onChange: (change: Partial<ReminderRule>) => void;
}) => {
  const { t } = useTranslation("reminders");
  const chosen = alertTypeOf(rule);
  const check = useCSSVariable("--color-primary");

  return (
    <Item.Group>
      {ALERT_TYPES.map((type, index) => (
        <Fragment key={type}>
          {index > 0 ? <Item.Separator /> : null}
          <Item
            size="sm"
            onPress={() => onChange(ruleChangeForAlertType(type))}
          >
            <Item.Media variant="icon">
              <AlertTypeIcon
                type={type}
                tone={type === chosen ? "foreground" : "muted-foreground"}
              />
            </Item.Media>
            <Item.Content>
              <Item.Title>{t(`alertType.types.${type}`)}</Item.Title>
              <Item.Description>
                {t(`alertType.hints.${type}`)}
              </Item.Description>
            </Item.Content>
            <Item.Actions>
              {type === chosen ? (
                <CheckIcon
                  size={18}
                  {...(typeof check === "string" ? { color: check } : {})}
                />
              ) : (
                <View className="size-[18px]" />
              )}
            </Item.Actions>
          </Item>
        </Fragment>
      ))}
    </Item.Group>
  );
};
