import { fileUrl } from "@alrisali/api/shared";
import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { ENV } from "@/env";
import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { SpeakerDialog } from "./speaker-dialog";

/** The Speakers Admins name on Gatherings: add, edit, delete. */
export const SpeakersSection = ({
  speakers,
  gatherings,
}: {
  speakers: readonly Speaker[];
  gatherings: readonly Gathering[];
}) => {
  const queryClient = useQueryClient();
  /** The Speaker being edited, "new" while adding one. */
  const [editing, setEditing] = useState<Speaker | "new" | null>(null);
  const [deleting, setDeleting] = useState<Speaker | null>(null);

  const remove = useMutation(
    orpc.gatherings.speakers.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.gatherings.list.queryKey(),
        });
        toast.success(`Deleted ${deleting?.name.ar ?? "the Speaker"}.`);
        setDeleting(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setDeleting(null);
      },
    })
  );

  return (
    <section className="flex flex-col gap-3" aria-labelledby="speakers-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="speakers-title" className="text-lg font-semibold">
            Speakers
          </h2>
          <p className="text-muted-foreground text-sm">
            The sheikhs and orators who lead Gatherings.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>Add Speaker</Button>
      </div>

      {speakers.length === 0 ? (
        <p className="text-muted-foreground border p-4 text-sm">
          No Speakers yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Photo</TableHead>
              <TableHead>Name (Arabic)</TableHead>
              <TableHead>Name (English)</TableHead>
              <TableHead>Gatherings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {speakers.map((speaker) => (
              <TableRow key={speaker.id}>
                <TableCell>
                  {speaker.photoKey ? (
                    <img
                      src={fileUrl(ENV.VITE_SERVER_URL, speaker.photoKey)}
                      alt={speaker.name.ar}
                      className="size-10 border object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="bg-muted size-10 border" />
                  )}
                </TableCell>
                <TableCell dir="rtl" lang="ar" className="text-left">
                  {speaker.name.ar}
                </TableCell>
                <TableCell>
                  {speaker.name.en || (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {
                    gatherings.filter(
                      (gathering) => gathering.speakerId === speaker.id
                    ).length
                  }
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(speaker)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleting(speaker)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editing === null ? null : (
        <SpeakerDialog
          key={editing === "new" ? "new" : editing.id}
          speaker={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDeleteDialog
        name={deleting?.name.ar ?? null}
        description="Devices stop showing this Speaker on their next sync. A Speaker who still leads a Gathering cannot be deleted."
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            remove.mutate({ id: deleting.id });
          }
        }}
      />
    </section>
  );
};
