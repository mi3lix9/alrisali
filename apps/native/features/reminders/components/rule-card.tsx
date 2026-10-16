import {
  MAX_MINUTES_BEFORE,
  REMINDER_SOUNDS,
} from "@alrisali/domain/reminders";
import type { ReminderRule } from "@alrisali/domain/reminders";
import {
  Card,
  Item,
  NumberInput,
  RadioGroup,
  Switch,
  Text,
} from "panelui-native";
import { useTranslation } from "react-i18next";

import { formatNumber, parseNumber } from "@/shared/lib/numbers";

/**
 * One Prayer Time's Reminder: on or off, minutes before, the tone, silent
 * and the Adhan voice. Silent wins over the voice, the voice over the tone.
 */
export const RuleCard = ({
  title,
  description,
  rule,
  onChange,
}: {
  title: string;
  description?: string;
  rule: ReminderRule;
  onChange: (
    change: Partial<
      Pick<
        ReminderRule,
        "enabled" | "minutesBefore" | "sound" | "muted" | "voice"
      >
    >
  ) => void;
}) => {
  const { t } = useTranslation("reminders");
  const toneDisabled = !rule.enabled || rule.muted || rule.voice;

  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        {description ? (
          <Card.Description>{description}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Content className="gap-4">
        <Item.Group>
          <Item size="sm">
            <Item.Content>
              <Item.Title>{t("rule.enabled")}</Item.Title>
            </Item.Content>
            <Item.Actions>
              <Switch
                label={`${title}: ${t("rule.enabled")}`}
                value={rule.enabled}
                onValueChange={(enabled) => onChange({ enabled })}
              />
            </Item.Actions>
          </Item>
          <Item.Separator />
          <Item size="sm">
            <Item.Content>
              <Item.Title>{t("rule.muted")}</Item.Title>
              <Item.Description>{t("rule.mutedHint")}</Item.Description>
            </Item.Content>
            <Item.Actions>
              <Switch
                label={`${title}: ${t("rule.muted")}`}
                value={rule.muted}
                disabled={!rule.enabled}
                onValueChange={(muted) => onChange({ muted })}
              />
            </Item.Actions>
          </Item>
          <Item.Separator />
          <Item size="sm">
            <Item.Content>
              <Item.Title>{t("rule.voice")}</Item.Title>
              <Item.Description>{t("rule.voiceHint")}</Item.Description>
            </Item.Content>
            <Item.Actions>
              <Switch
                label={`${title}: ${t("rule.voice")}`}
                value={rule.voice}
                disabled={!rule.enabled || rule.muted}
                onValueChange={(voice) => onChange({ voice })}
              />
            </Item.Actions>
          </Item>
        </Item.Group>
        <NumberInput
          label={t("rule.minutesBefore")}
          value={rule.minutesBefore}
          // A new function each render, so a change of digits re-renders
          // the field (this card re-renders through useTranslation).
          formatValue={(minutes) => formatNumber(minutes)}
          // The keyboard may type Arabic-Indic digits, which parseFloat
          // cannot read.
          parseValue={parseNumber}
          min={0}
          max={MAX_MINUTES_BEFORE}
          step={1}
          disabled={!rule.enabled}
          onValueChange={(minutesBefore) => {
            if (
              Number.isInteger(minutesBefore) &&
              minutesBefore !== rule.minutesBefore
            ) {
              onChange({ minutesBefore });
            }
          }}
        />
        <Text weight="medium">{t("rule.sound")}</Text>
        <RadioGroup
          accessibilityLabel={`${title}: ${t("rule.sound")}`}
          value={rule.sound}
          disabled={toneDisabled}
          onValueChange={(value) => {
            const sound = REMINDER_SOUNDS.find((option) => option === value);
            if (sound) {
              onChange({ sound });
            }
          }}
        >
          {REMINDER_SOUNDS.map((sound) => (
            <RadioGroup.Item
              key={sound}
              value={sound}
              label={t(`rule.sounds.${sound}`)}
            />
          ))}
        </RadioGroup>
      </Card.Content>
    </Card>
  );
};
