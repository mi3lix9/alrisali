import { BUILT_IN_OCCASIONS } from "@alrisali/domain/shared";
import type { Occasion, OccasionDetails } from "@alrisali/domain/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { HIJRI_MONTH_NAMES } from "@/shared/lib/hijri-months";
import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";

import { OccasionForm } from "../components/occasion-form";
import { OCCASION_TYPE_LABELS } from "../utils/occasion-labels";

const SYNC_NOTE = "Devices show it after their next sync.";

const onError = (error: Error) => {
  toast.error(error.message);
};

/** Which form is open: none, a new Occasion, or one being edited. */
type Editing = null | "new" | Occasion;

export const OccasionsScreen = () => {
  const queryClient = useQueryClient();
  const published = useQuery(orpc.occasions.list.queryOptions());
  const [editing, setEditing] = useState<Editing>(null);

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: orpc.occasions.list.queryKey(),
    });

  const create = useMutation(
    orpc.occasions.create.mutationOptions({
      onSuccess: async (occasion) => {
        setEditing(null);
        await refresh();
        toast.success(`Published ${occasion.name.en}. ${SYNC_NOTE}`);
      },
      onError,
    })
  );
  const update = useMutation(
    orpc.occasions.update.mutationOptions({
      onSuccess: async (occasion) => {
        setEditing(null);
        await refresh();
        if (occasion) {
          toast.success(`Saved ${occasion.name.en}. ${SYNC_NOTE}`);
        } else {
          toast.error("Another Admin deleted this Occasion meanwhile.");
        }
      },
      onError,
    })
  );
  const remove = useMutation(
    orpc.occasions.delete.mutationOptions({
      onSuccess: async () => {
        await refresh();
        toast.success(`Deleted. ${SYNC_NOTE}`);
      },
      onError,
    })
  );

  if (published.isPending) {
    return <Loader />;
  }
  if (published.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the Occasions: {published.error.message}
      </p>
    );
  }

  const save = async (details: OccasionDetails) => {
    if (editing === "new") {
      await create.mutateAsync(details);
    } else if (editing) {
      await update.mutateAsync({ id: editing.id, ...details });
    }
  };

  const confirmDelete = (occasion: Occasion) => {
    // oxlint-disable-next-line no-alert -- a native confirm is enough for an Admin-only tool
    if (window.confirm(`Delete "${occasion.name.en}" from every device?`)) {
      remove.mutate({ id: occasion.id });
    }
  };

  const { occasions } = published.data;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Occasions</h1>
          <p className="text-muted-foreground">
            Occasions you add show in every Believer&apos;s calendar and on
            Home, after the {BUILT_IN_OCCASIONS.length} built into the app. They
            recur every Hijri year; one on the 30th falls on the 29th in a
            29-day month.
          </p>
        </div>
        {editing === null ? (
          <Button onClick={() => setEditing("new")}>Add Occasion</Button>
        ) : null}
      </div>

      {editing === null ? null : (
        <OccasionForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          submitLabel={editing === "new" ? "Publish" : "Save"}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {occasions.length === 0 ? (
        <p className="text-muted-foreground">
          No Occasions published yet: devices show only the built-in ones.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-muted-foreground text-start">
            <tr className="border-b">
              <th className="py-2 text-start font-medium">Date</th>
              <th className="py-2 text-start font-medium">Type</th>
              <th className="py-2 text-start font-medium">English</th>
              <th className="py-2 text-start font-medium">Arabic</th>
              <th className="py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {occasions.map((occasion) => (
              <tr key={occasion.id} className="border-b">
                <td className="py-2">
                  {`${occasion.day} ${HIJRI_MONTH_NAMES[occasion.month]}`}
                </td>
                <td className="py-2">{OCCASION_TYPE_LABELS[occasion.type]}</td>
                <td className="py-2">{occasion.name.en}</td>
                <td className="py-2" dir="rtl" lang="ar">
                  {occasion.name.ar}
                </td>
                <td
                  className="py-2"
                  aria-label={`${occasion.name.en}: actions`}
                >
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(occasion)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={remove.isPending}
                      onClick={() => confirmDelete(occasion)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
};
