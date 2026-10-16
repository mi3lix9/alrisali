import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";

import { AUDIENCE_LABELS, describeStatus } from "../utils/format";

const EMPTY_TEXT = { title: "", body: "" };

export const AnnouncementsScreen = () => {
  const navigate = useNavigate();
  const [includeArchived, setIncludeArchived] = useState(false);
  const announcements = useQuery(
    orpc.announcements.list.queryOptions({ input: { includeArchived } })
  );
  const create = useMutation(
    orpc.announcements.create.mutationOptions({
      onSuccess: async ({ id }) => {
        await navigate({ to: "/admin/announcements/$id", params: { id } });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  if (announcements.isPending) {
    return <Loader />;
  }
  if (announcements.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the Announcements: {announcements.error.message}
      </p>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Announcements</h1>
          <p className="text-muted-foreground">
            Written once in Arabic and English; each Believer receives the one
            in their app&apos;s language as a push notification and in the
            app&apos;s inbox.
          </p>
        </div>
        <Button
          disabled={create.isPending}
          onClick={() =>
            create.mutate({
              text: { ar: EMPTY_TEXT, en: EMPTY_TEXT },
              audience: "all",
            })
          }
        >
          New Announcement
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={(event) => setIncludeArchived(event.target.checked)}
        />
        Show archived
      </label>

      {announcements.data.announcements.length === 0 ? (
        <p className="text-muted-foreground">No Announcements yet.</p>
      ) : (
        <ul className="flex flex-col divide-y border">
          {announcements.data.announcements.map((announcement) => (
            <li key={announcement.id}>
              <Link
                to="/admin/announcements/$id"
                params={{ id: announcement.id }}
                className="hover:bg-muted flex flex-col gap-1 p-4 transition-colors"
              >
                <span className="font-medium">
                  {announcement.text.en.title ||
                    announcement.text.ar.title ||
                    "Untitled"}
                </span>
                <span className="text-muted-foreground text-sm">
                  {describeStatus(announcement)} ·{" "}
                  {AUDIENCE_LABELS[announcement.audience]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};
