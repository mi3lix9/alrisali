import type { AdhanCatalogueEntry } from "@alrisali/domain/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";

import { AdhanDialog } from "../components/adhan-dialog";
import { ConfirmDeleteDialog } from "../components/confirm-delete-dialog";
import { formatBytes, formatSeconds } from "../utils/adhan-form";
import { moveItem } from "../utils/move-item";

const SYNC_NOTE = "Devices update on their next sync.";

const onError = (error: Error) => {
  toast.error(error.message);
};

/** The voice being edited, or `"new"` for the add dialog; null when closed. */
type Editing = AdhanCatalogueEntry | "new" | null;

export const AdhansScreen = () => {
  const queryClient = useQueryClient();
  const adhans = useQuery(orpc.adhans.list.queryOptions());
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<AdhanCatalogueEntry | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: orpc.adhans.key() });

  const reorder = useMutation(
    orpc.adhans.reorder.mutationOptions({
      onSuccess: async () => {
        await refresh();
        toast.success(`Order saved. ${SYNC_NOTE}`);
      },
      onError,
    })
  );
  const remove = useMutation(
    orpc.adhans.remove.mutationOptions({
      onSuccess: async () => {
        setDeleting(null);
        await refresh();
        toast.success(`Voice deleted. ${SYNC_NOTE}`);
      },
      onError,
    })
  );
  const busy = reorder.isPending || remove.isPending;

  if (adhans.isPending) {
    return <Loader />;
  }
  if (adhans.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the adhan voices: {adhans.error.message}
      </p>
    );
  }

  const voices = adhans.data.adhans;
  const ids = voices.map(({ id }) => id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Adhan voices</h1>
          <p className="text-muted-foreground">
            The voices Believers can download, in the order devices list them. A
            Believer must have both recordings of a voice downloaded to use it.
            Publish only recordings you are licensed to distribute.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>Add voice</Button>
      </div>

      {voices.length === 0 ? (
        <p className="text-muted-foreground">No voices yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {voices.map((voice, position) => (
            <li
              key={voice.id}
              className="flex flex-wrap items-center gap-4 border p-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline gap-3">
                  <span dir="rtl" lang="ar" className="font-medium">
                    {voice.name.ar}
                  </span>
                  <span className="text-muted-foreground">{voice.name.en}</span>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs">
                  <span>{voice.credit}</span>
                  <span>
                    Full: {formatSeconds(voice.full.seconds)} ·{" "}
                    {formatBytes(voice.full.bytes)}
                  </span>
                  <span>
                    Takbir: {formatSeconds(voice.takbir.seconds)} ·{" "}
                    {formatBytes(voice.takbir.bytes)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditing(voice)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Move ${voice.name.en} up`}
                  disabled={busy || position === 0}
                  onClick={() =>
                    reorder.mutate({
                      ids: moveItem(ids, position, position - 1),
                    })
                  }
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Move ${voice.name.en} down`}
                  disabled={busy || position === voices.length - 1}
                  onClick={() =>
                    reorder.mutate({
                      ids: moveItem(ids, position, position + 1),
                    })
                  }
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => setDeleting(voice)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {editing === null ? null : (
        <AdhanDialog
          // A fresh form for each voice opened.
          key={editing === "new" ? "new" : editing.id}
          adhan={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDeleteDialog
        name={deleting?.name.en ?? null}
        pending={remove.isPending}
        onConfirm={() => {
          if (deleting) {
            remove.mutate({ id: deleting.id });
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </main>
  );
};
