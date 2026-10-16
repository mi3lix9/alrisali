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
import { router } from "expo-router";
import { Button, Input, Text, Textarea, toast } from "panelui-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, View } from "react-native";
import type { LayoutChangeEvent, ScrollViewInstance } from "react-native";

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

/** The fields in the order the form shows them. */
const FIELDS: readonly ContactMessageField[] = [
  "name",
  "email",
  "subject",
  "message",
];

/**
 * Sends the team a Contact Message. Guests may too; a signed-in Believer
 * starts with their name and email filled in. A rejected draft scrolls to its
 * first wrong field, which may be far above the Send button,
 * and announces it; a sent one
 * returns to Settings with a toast.
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
  const scroll = useRef<ScrollViewInstance>(null);
  // Where each field sits in the form, to scroll to the first wrong one.
  const offsets = useRef<Partial<Record<ContactMessageField, number>>>({});
  const send = useMutation(
    orpc.contact.send.mutationOptions({
      onSuccess: () => {
        toast.show({
          variant: "success",
          label: t("sentTitle"),
          description: t("sentDescription"),
        });
        router.back();
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
    const first = FIELDS.find((field) => problems.has(field));
    if (first === undefined) {
      send.mutate(contactMessageSchema.parse(draft));
      return;
    }
    // Less the form's gap, so the field does not touch the header.
    scroll.current?.scrollTo({
      y: Math.max(0, (offsets.current[first] ?? 0) - 16),
    });
    AccessibilityInfo.announceForAccessibility(
      t(`invalid.${first}`, { ...CONTACT_MESSAGE_LIMITS[first] })
    );
  };

  const placed =
    (field: ContactMessageField) =>
    ({ nativeEvent }: LayoutChangeEvent) => {
      offsets.current[field] = nativeEvent.layout.y;
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

  const tooMany =
    send.error instanceof ORPCError && send.error.code === "TOO_MANY_REQUESTS";

  return (
    <Screen ref={scroll}>
      <Text muted>{t("description")}</Text>
      <View onLayout={placed("name")}>
        <Input
          {...fieldProps("name")}
          autoComplete="name"
          textContentType="name"
        />
      </View>
      <View onLayout={placed("email")}>
        <Input
          {...fieldProps("email")}
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <View onLayout={placed("subject")}>
        <Input {...fieldProps("subject")} />
      </View>
      <View onLayout={placed("message")}>
        <Textarea {...fieldProps("message")} autoGrow rows={6} />
      </View>
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
