import {
  CONTACT_MESSAGE_LIMITS,
  contactMessageSchema,
} from "@alrisali/domain/contact";
import type {
  ContactMessageField,
  ContactMessageInput,
} from "@alrisali/domain/contact";
import type { Language } from "@alrisali/i18n";
import { ORPCError } from "@orpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

import { contactFormCopy } from "../i18n";

const EMPTY: ContactMessageInput = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const FIELDS = [
  { field: "name", type: "text", autoComplete: "name" },
  { field: "email", type: "email", autoComplete: "email" },
  { field: "subject", type: "text", autoComplete: "off" },
] as const;

/** Every field the draft breaks, checked with the server's own limits. */
const invalidFields = (draft: ContactMessageInput): Set<ContactMessageField> =>
  new Set(
    contactMessageSchema
      .safeParse(draft)
      .error?.issues.map(({ path }) => path[0] as ContactMessageField)
  );

/** Sends the team a Contact Message. Anyone may: no account needed. */
export const ContactForm = ({ language }: { language: Language }) => {
  const copy = contactFormCopy[language];
  const [draft, setDraft] = useState(EMPTY);
  const [invalid, setInvalid] = useState(new Set<ContactMessageField>());
  const send = useMutation(
    orpc.contact.send.mutationOptions({
      onSuccess: () => {
        setDraft(EMPTY);
      },
    })
  );

  const edit = (field: ContactMessageField, value: string) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    // Once a field was flagged, it clears as soon as it is fixed.
    if (invalid.has(field)) {
      setInvalid(invalidFields(next));
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problems = invalidFields(draft);
    setInvalid(problems);
    if (problems.size === 0) {
      send.mutate(contactMessageSchema.parse(draft));
    }
  };

  const fieldProps = (field: ContactMessageField) => ({
    id: `contact-${field}`,
    name: field,
    value: draft[field],
    required: true,
    "aria-invalid": invalid.has(field),
    ...(invalid.has(field)
      ? { "aria-describedby": `contact-${field}-error` }
      : {}),
  });

  const fieldError = (field: ContactMessageField) =>
    invalid.has(field) ? (
      <p id={`contact-${field}-error`} className="text-destructive text-sm">
        {copy.invalid[field]}
      </p>
    ) : null;

  if (send.isSuccess) {
    return (
      <section aria-live="polite" className="grid gap-3 border p-6">
        <h2 className="text-xl font-semibold">{copy.sentTitle}</h2>
        <p className="text-muted-foreground">{copy.sentDescription}</p>
        <Button
          variant="outline"
          className="justify-self-start"
          onClick={() => send.reset()}
        >
          {copy.sendAnother}
        </Button>
      </section>
    );
  }

  const tooMany =
    send.error instanceof ORPCError && send.error.code === "TOO_MANY_REQUESTS";

  return (
    <form noValidate onSubmit={submit} className="grid gap-4">
      {FIELDS.map(({ field, type, autoComplete }) => (
        <div key={field} className="grid gap-2">
          <Label htmlFor={`contact-${field}`}>{copy.fields[field]}</Label>
          <Input
            {...fieldProps(field)}
            type={type}
            autoComplete={autoComplete}
            maxLength={CONTACT_MESSAGE_LIMITS[field].max}
            onChange={(event) => edit(field, event.target.value)}
          />
          {fieldError(field)}
        </div>
      ))}
      <div className="grid gap-2">
        <Label htmlFor="contact-message">{copy.fields.message}</Label>
        <Textarea
          {...fieldProps("message")}
          rows={8}
          maxLength={CONTACT_MESSAGE_LIMITS.message.max}
          onChange={(event) => edit("message", event.target.value)}
        />
        <div className="flex justify-between gap-4">
          {fieldError("message") ?? <span />}
          <span className="text-muted-foreground text-xs tabular-nums">
            {draft.message.length}/{CONTACT_MESSAGE_LIMITS.message.max}
          </span>
        </div>
      </div>

      {send.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {tooMany ? copy.tooMany : copy.failed}
        </p>
      ) : null}

      <Button
        type="submit"
        className="justify-self-start"
        disabled={send.isPending}
      >
        {send.isPending ? copy.sending : copy.send}
      </Button>
    </form>
  );
};
