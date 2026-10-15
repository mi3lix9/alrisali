import {
  ANNOUNCEMENT_LANGUAGES,
  AUDIENCES,
  BODY_MAX_LENGTH,
  missingLanguages,
  TITLE_MAX_LENGTH,
} from "@alrisali/domain/announcements";
import type {
  Announcement,
  AnnouncementDraft,
  AnnouncementLanguage,
} from "@alrisali/domain/announcements";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import Loader from "@/shared/ui/loader";

import { AUDIENCE_LABELS, describeStatus, toLocalInput } from "../utils/format";

const LANGUAGE_NAMES: Record<AnnouncementLanguage, string> = {
  ar: "Arabic",
  en: "English",
};

const HOUR_MS = 60 * 60 * 1000;

const TEXTAREA =
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-none border bg-transparent px-2.5 py-2 text-xs outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50";

const onError = (error: Error) => {
  toast.error(error.message);
};

/** Asks before something that cannot be undone. */
// oxlint-disable-next-line no-alert -- a plain confirmation is enough for the admin tool
const confirmed = (question: string): boolean => window.confirm(question);

const LanguageFields = ({
  language,
  draft,
  disabled,
  onChange,
}: {
  language: AnnouncementLanguage;
  draft: AnnouncementDraft;
  disabled: boolean;
  onChange: (draft: AnnouncementDraft) => void;
}) => {
  const text = draft.text[language];
  const dir = language === "ar" ? "rtl" : "ltr";
  const change = (patch: Partial<typeof text>) =>
    onChange({
      ...draft,
      text: { ...draft.text, [language]: { ...text, ...patch } },
    });

  return (
    <fieldset className="flex flex-col gap-3 border p-4">
      <legend className="px-1 text-sm font-medium">
        {LANGUAGE_NAMES[language]}
      </legend>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`title-${language}`}>Title</Label>
        <Input
          id={`title-${language}`}
          dir={dir}
          lang={language}
          maxLength={TITLE_MAX_LENGTH}
          disabled={disabled}
          value={text.title}
          onChange={(event) => change({ title: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`body-${language}`}>Message</Label>
        <textarea
          id={`body-${language}`}
          dir={dir}
          lang={language}
          maxLength={BODY_MAX_LENGTH}
          disabled={disabled}
          className={TEXTAREA}
          value={text.body}
          onChange={(event) => change({ body: event.target.value })}
        />
      </div>
    </fieldset>
  );
};

const Editor = ({ announcement }: { announcement: Announcement }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<AnnouncementDraft>({
    text: announcement.text,
    audience: announcement.audience,
  });
  const [sendAt, setSendAt] = useState(() =>
    toLocalInput(announcement.scheduledAt ?? Date.now() + HOUR_MS)
  );
  const sent = announcement.status === "sent";
  const dirty =
    JSON.stringify(draft) !==
    JSON.stringify({
      text: announcement.text,
      audience: announcement.audience,
    });
  const missing = missingLanguages(draft.text);

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: orpc.announcements.key(),
    });
  };
  const id = { id: announcement.id };
  const save = useMutation(
    orpc.announcements.update.mutationOptions({ onError })
  );
  const saveIfChanged = async () => {
    if (dirty) {
      await save.mutateAsync({ ...id, ...draft });
    }
  };

  const saveDraft = useMutation({
    mutationFn: saveIfChanged,
    onSuccess: async () => {
      await refresh();
      toast.success("Draft saved.");
    },
  });
  const schedule = useMutation({
    mutationFn: async () => {
      await saveIfChanged();
      return orpc.announcements.schedule.call({
        ...id,
        at: new Date(sendAt).getTime(),
      });
    },
    onSuccess: async (scheduled) => {
      await refresh();
      toast.success(describeStatus(scheduled));
    },
    onError,
  });
  const unschedule = useMutation(
    orpc.announcements.unschedule.mutationOptions({
      onSuccess: refresh,
      onError,
    })
  );
  const publish = useMutation({
    mutationFn: async () => {
      await saveIfChanged();
      return orpc.announcements.publishNow.call(id);
    },
    onSuccess: async ({ devices }) => {
      await refresh();
      toast.success(`Sent to ${devices} device${devices === 1 ? "" : "s"}.`);
    },
    onError,
  });
  const sendTest = useMutation({
    mutationFn: async () => {
      await saveIfChanged();
      return orpc.announcements.sendTest.call(id);
    },
    onSuccess: async ({ devices }) => {
      await refresh();
      toast.success(
        devices === 0
          ? "None of your devices is registered: sign in to the app with this account first."
          : `Test sent to ${devices} of your device${devices === 1 ? "" : "s"}.`
      );
    },
    onError,
  });
  const duplicate = useMutation(
    orpc.announcements.duplicate.mutationOptions({
      onSuccess: async (copy) => {
        await refresh();
        await navigate({
          to: "/admin/announcements/$id",
          params: { id: copy.id },
        });
        toast.success("Duplicated as a new draft.");
      },
      onError,
    })
  );
  const remove = useMutation(
    orpc.announcements.remove.mutationOptions({
      onSuccess: async () => {
        await refresh();
        await navigate({ to: "/admin/announcements" });
      },
      onError,
    })
  );
  const busy = [
    saveDraft,
    schedule,
    unschedule,
    publish,
    sendTest,
    duplicate,
    remove,
  ].some((mutation) => mutation.isPending);
  const publishable = missing.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <Link
          to="/admin/announcements"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Announcements
        </Link>
        <h1 className="text-2xl font-semibold">
          {announcement.text.en.title ||
            announcement.text.ar.title ||
            "Untitled"}
        </h1>
        <p className="text-muted-foreground">{describeStatus(announcement)}</p>
      </div>

      {ANNOUNCEMENT_LANGUAGES.map((language) => (
        <LanguageFields
          key={language}
          language={language}
          draft={draft}
          disabled={sent}
          onChange={setDraft}
        />
      ))}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Audience</legend>
        {AUDIENCES.map((audience) => (
          <label key={audience} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="audience"
              value={audience}
              disabled={sent}
              checked={draft.audience === audience}
              onChange={() => setDraft({ ...draft, audience })}
            />
            {AUDIENCE_LABELS[audience]}
          </label>
        ))}
      </fieldset>

      {sent ? null : (
        <>
          {publishable ? null : (
            <p className="text-muted-foreground text-sm">
              Write the title and message in{" "}
              {missing
                .map((language) => LANGUAGE_NAMES[language])
                .join(" and ")}{" "}
              before sending.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              disabled={busy || !dirty}
              onClick={() => saveDraft.mutate()}
            >
              Save draft
            </Button>
            <Button
              variant="outline"
              disabled={busy || !publishable}
              onClick={() => sendTest.mutate()}
            >
              Send me a test
            </Button>
            <Button
              disabled={busy || !publishable}
              onClick={() => {
                if (confirmed("Send this Announcement to its audience now?")) {
                  publish.mutate();
                }
              }}
            >
              Publish now
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="send-at">Send at (your local time)</Label>
              <Input
                id="send-at"
                type="datetime-local"
                value={sendAt}
                onChange={(event) => setSendAt(event.target.value)}
              />
            </div>
            <Button
              variant="outline"
              disabled={busy || !publishable || sendAt === ""}
              onClick={() => schedule.mutate()}
            >
              {announcement.status === "scheduled" ? "Reschedule" : "Schedule"}
            </Button>
            {announcement.status === "scheduled" ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => unschedule.mutate(id)}
              >
                Back to draft
              </Button>
            ) : null}
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-3 border-t pt-4">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => duplicate.mutate(id)}
        >
          Duplicate
        </Button>
        {sent ? null : (
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => {
              if (confirmed("Delete this Announcement?")) {
                remove.mutate(id);
              }
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </main>
  );
};

export const AnnouncementEditorScreen = ({ id }: { id: string }) => {
  const announcement = useQuery(
    orpc.announcements.get.queryOptions({ input: { id } })
  );

  if (announcement.isPending) {
    return <Loader />;
  }
  if (announcement.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the Announcement: {announcement.error.message}
      </p>
    );
  }
  // Keyed by its last change, so the form restarts from what was saved.
  return (
    <Editor
      key={`${announcement.data.id}-${announcement.data.updatedAt}`}
      announcement={announcement.data}
    />
  );
};
