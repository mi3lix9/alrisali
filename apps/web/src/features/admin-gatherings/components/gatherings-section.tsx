import { sortGatherings } from "@alrisali/domain/gatherings";
import type { Gathering, Speaker } from "@alrisali/domain/gatherings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { ATTENDANCE_LABELS, TYPE_LABELS } from "../utils/labels";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { GatheringDialog } from "./gathering-dialog";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

/** Every Gathering, inactive ones too, by date and time: add, edit, delete. */
export const GatheringsSection = ({
  gatherings,
  speakers,
}: {
  gatherings: readonly Gathering[];
  speakers: readonly Speaker[];
}) => {
  const queryClient = useQueryClient();
  /** The Gathering being edited, "new" while adding one. */
  const [editing, setEditing] = useState<Gathering | "new" | null>(null);
  const [deleting, setDeleting] = useState<Gathering | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const remove = useMutation(
    orpc.gatherings.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.gatherings.list.queryKey(),
        });
        toast.success(
          `Deleted ${deleting?.title.ar ?? "the Gathering"}. Devices update on their next sync.`
        );
        setDeleting(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setDeleting(null);
      },
    })
  );

  const speakerNames = new Map(
    speakers.map((speaker) => [speaker.id, speaker.name.ar])
  );
  const shown = sortGatherings(
    gatherings.filter(
      (gathering) =>
        filter === "all" || gathering.active === (filter === "active")
    )
  );

  return (
    <section className="flex flex-col gap-3" aria-labelledby="gatherings-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="gatherings-title" className="text-lg font-semibold">
            Gatherings
          </h2>
          <p className="text-muted-foreground text-sm">
            Majalis, lectures, celebrations and mourning gatherings. Devices
            show only active ones.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <fieldset className="flex gap-1" aria-label="Show">
            {FILTERS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={filter === option.value ? "default" : "outline"}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </fieldset>
          <Button onClick={() => setEditing("new")}>Add Gathering</Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-muted-foreground border p-4 text-sm">
          {gatherings.length === 0
            ? "No Gatherings yet."
            : "No Gatherings match this filter."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Speaker</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((gathering) => (
              <TableRow key={gathering.id}>
                <TableCell>
                  <div lang="ar" dir="rtl" className="text-left">
                    {gathering.title.ar}
                  </div>
                  {gathering.title.en ? (
                    <div className="text-muted-foreground">
                      {gathering.title.en}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="tabular-nums">{gathering.date}</TableCell>
                <TableCell className="tabular-nums">
                  {gathering.endTime
                    ? `${gathering.startTime}–${gathering.endTime}`
                    : gathering.startTime}
                </TableCell>
                <TableCell lang="ar" dir="rtl" className="text-left">
                  {gathering.venue.name.ar}
                </TableCell>
                <TableCell lang="ar" dir="rtl" className="text-left">
                  {gathering.speakerId
                    ? (speakerNames.get(gathering.speakerId) ?? "-")
                    : "-"}
                </TableCell>
                <TableCell>{TYPE_LABELS[gathering.type]}</TableCell>
                <TableCell>{ATTENDANCE_LABELS[gathering.attendance]}</TableCell>
                <TableCell>
                  {gathering.active ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(gathering)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleting(gathering)}
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
        <GatheringDialog
          key={editing === "new" ? "new" : editing.id}
          gathering={editing === "new" ? null : editing}
          speakers={speakers}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDeleteDialog
        name={deleting?.title.ar ?? null}
        description="Devices stop showing this Gathering on their next sync. To hide it for now and keep it, make it inactive instead."
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
