import "../i18n";
import {
  CONTACT_MESSAGE_LIMITS,
  contactMessageSchema,
} from "@alrisali/domain/contact";
import type {
  ContactMessageField,
  ContactMessageInput,
} from "@alrisali/domain/contact";
import { ORPCError } from "@orpc/client";
import { captureException } from "@sentry/react-native";
import { useMutation } from "@tanstack/react-query";
import { Button, Input, Text, Textarea } from "panelui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { authClient } from "@/shared/lib/auth-client";
import { orpc } from "@/shared/lib/orpc";
import { Screen } from "@/shared/ui/screen";

/** Every field the draft breaks, checked with the server's own limits. */
const invalidFields = (draft: ContactMessageInput): Set<ContactMessageField> =>
  new Set(
    contactMessageSchema
      .safeParse(draft)
      .error?.issues.map(({ path }) => path[0] as ContactMessageField)
  );

/**
 * Sends the team a Contact Message. Guests may too; a signed-in Believer
 * starts with their name and email filled in.
 */
export const ContactScreen = () => {
  const { t } = useTranslation("contact");
  const { data: session } = authClient.useSession();
  const blank: ContactMessageInput = {
    name: session?.user.name ?? "",
    email: session?.user.email ?? "",
    subject: "",
    message: "",
  };
  const [draft, setDraft] = useState(blank);
  const [invalid, setInvalid] = useState(new Set<ContactMessageField>());
  const send = useMutation(
    orpc.contact.send.mutationOptions({
      onSuccess: () => {
        setDraft(blank);
      },
      onError: (error) => {
        if (!(error instanceof ORPCError)) {
          captureException(error);
        }
      },
    })
  );

  const edit = (field: ContactMessageField) => (value: string) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    // Once a field was flagged, it clears as soon as it is fixed.
    if (invalid.has(field)) {
      setInvalid(invalidFields(next));
    }
  };

  const submit = () => {
    const problems = invalidFields(draft);
    setInvalid(problems);
    if (problems.size === 0) {
      send.mutate(contactMessageSchema.parse(draft));
    }
  };

  const fieldProps = (field: ContactMessageField) => ({
    label: t(`fields.${field}`),
    value: draft[field],
    onChangeText: edit(field),
    maxLength: CONTACT_MESSAGE_LIMITS[field].max,
    isRequired: true,
    ...(invalid.has(field)
      ? {
          errorMessage: t(`invalid.${field}`, {
            ...CONTACT_MESSAGE_LIMITS[field],
          }),
        }
      : {}),
  });

  if (send.isSuccess) {
    return (
      <Screen>
        <View className="gap-2" accessibilityLiveRegion="polite">
          <Text size="lg" weight="semibold" accessibilityRole="header">
            {t("sentTitle")}
          </Text>
          <Text muted>{t("sentDescription")}</Text>
        </View>
        <Button variant="outline" onPress={() => send.reset()}>
          {t("sendAnother")}
        </Button>
      </Screen>
    );
  }

  const tooMany =
    send.error instanceof ORPCError && send.error.code === "TOO_MANY_REQUESTS";

  return (
    <Screen>
      <Text muted>{t("description")}</Text>
      <Input
        {...fieldProps("name")}
        autoComplete="name"
        textContentType="name"
      />
      <Input
        {...fieldProps("email")}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input {...fieldProps("subject")} />
      <Textarea {...fieldProps("message")} autoGrow rows={6} />
      {send.isError ? (
        <Text className="text-destructive" accessibilityLiveRegion="polite">
          {tooMany ? t("tooMany") : t("failed")}
        </Text>
      ) : null}
      <Button onPress={submit} disabled={send.isPending}>
        {t("send")}
      </Button>
    </Screen>
  );
};
