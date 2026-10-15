import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Button, buttonVariants } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";

import { formatHijriWindow } from "../utils/hijri-window";
import { moveItem } from "../utils/move-item";
import { NEW_PROGRAM_ID } from "./program-edit-screen";

const SYNC_NOTE = "Devices update on their next sync.";

const onError = (error: Error) => {
  toast.error(error.message);
};

export const ProgramsScreen = () => {
  const queryClient = useQueryClient();
  const programs = useQuery(orpc.programs.list.queryOptions());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: orpc.programs.key() });

  const toggle = useMutation(
    orpc.programs.save.mutationOptions({
      onSuccess: async (saved) => {
        await refresh();
        toast.success(
          `${saved.name.en} is now ${saved.active ? "active" : "inactive"}. ${SYNC_NOTE}`
        );
      },
      onError,
    })
  );
  const reorder = useMutation(
    orpc.programs.reorder.mutationOptions({
      onSuccess: async () => {
        await refresh();
        toast.success(`Order saved. ${SYNC_NOTE}`);
      },
      onError,
    })
  );
  const remove = useMutation(
    orpc.programs.remove.mutationOptions({
      onSuccess: async () => {
        setConfirmingId(null);
        await refresh();
        toast.success(`Program deleted. ${SYNC_NOTE}`);
      },
      onError,
    })
  );
  const busy = toggle.isPending || reorder.isPending || remove.isPending;

  if (programs.isPending) {
    return <Loader />;
  }
  if (programs.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the Programs: {programs.error.message}
      </p>
    );
  }

  const ids = programs.data.map(({ id }) => id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Official Programs</h1>
          <p className="text-muted-foreground">
            Programs Believers can subscribe to, in the order devices list them.
            General ones show all year, Seasonal ones within their Hijri window.
          </p>
        </div>
        <Link
          to="/admin/programs/$id"
          params={{ id: NEW_PROGRAM_ID }}
          className={buttonVariants()}
        >
          New Program
        </Link>
      </div>

      {programs.data.length === 0 ? (
        <p className="text-muted-foreground">No Programs yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {programs.data.map((program, index) => (
            <li
              key={program.id}
              className="flex flex-wrap items-center gap-4 border p-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline gap-3">
                  <span className="font-medium">{program.name.en}</span>
                  <span dir="rtl" className="text-muted-foreground">
                    {program.name.ar}
                  </span>
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                  <span>
                    {program.category === "seasonal"
                      ? `Seasonal · ${formatHijriWindow(program.window)}`
                      : "General · all year"}
                  </span>
                  <span
                    className={
                      program.active ? "text-foreground" : "text-destructive"
                    }
                  >
                    {program.active ? "Active" : "Inactive"}
                  </span>
                  <span>
                    {program.acts.length} Act
                    {program.acts.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {confirmingId === program.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Delete {program.name.en} and its Acts?
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => remove.mutate({ id: program.id })}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/admin/programs/$id"
                    params={{ id: program.id }}
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                    })}
                  >
                    Edit
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      toggle.mutate({ ...program, active: !program.active })
                    }
                  >
                    {program.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="Move up"
                    disabled={busy || index === 0}
                    onClick={() =>
                      reorder.mutate({ ids: moveItem(ids, index, index - 1) })
                    }
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="Move down"
                    disabled={busy || index === ids.length - 1}
                    onClick={() =>
                      reorder.mutate({ ids: moveItem(ids, index, index + 1) })
                    }
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmingId(program.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </main>
  );
};
