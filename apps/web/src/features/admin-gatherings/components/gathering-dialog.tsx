import { ATTENDANCE, GATHERING_TYPES } from "@alrisali/domain/gatherings";
import type {
  Attendance,
  Gathering,
  GatheringType,
  Speaker,
} from "@alrisali/domain/gatherings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";

import { parseCoordinates } from "../utils/coordinates";
import {
  emptyGatheringForm,
  gatheringToForm,
  validateGatheringForm,
} from "../utils/gathering-form";
import type { FieldErrors, GatheringForm } from "../utils/gathering-form";
import { ATTENDANCE_LABELS, TYPE_LABELS } from "../utils/labels";
import { Field } from "./field";

type TextField = {
  [K in keyof GatheringForm]: GatheringForm[K] extends string ? K : never;
}[keyof GatheringForm];

/** Where the contract reports each form field's errors. */
const ERROR_PATHS: Record<TextField, string> = {
  titleAr: "title.ar",
  titleEn: "title.en",
  descriptionAr: "description.ar",
  descriptionEn: "description.en",
  type: "type",
  date: "date",
  startTime: "startTime",
  endTime: "endTime",
  venueNameAr: "venue.name.ar",
  venueNameEn: "venue.name.en",
  address: "venue.address",
  latitude: "venue.latitude",
  longitude: "venue.longitude",
  speakerId: "speakerId",
  livestreamUrl: "livestreamUrl",
  attendance: "attendance",
};

const isGatheringType = (value: string): value is GatheringType =>
  (GATHERING_TYPES as readonly string[]).includes(value);

const isAttendance = (value: string): value is Attendance =>
  (ATTENDANCE as readonly string[]).includes(value);

/** Adds a Gathering (`gathering` null) or edits one, every field of it. */
export const GatheringDialog = ({
  gathering,
  speakers,
  onClose,
}: {
  gathering: Gathering | null;
  speakers: readonly Speaker[];
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GatheringForm>(() =>
    gathering ? gatheringToForm(gathering) : emptyGatheringForm()
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [location, setLocation] = useState("");

  const save = useMutation(
    orpc.gatherings.save.mutationOptions({
      onSuccess: async (saved) => {
        await queryClient.invalidateQueries({
          queryKey: orpc.gatherings.list.queryKey(),
        });
        toast.success(
          `${gathering ? "Updated" : "Published"} ${saved.title.ar}. Devices update on their next sync.`
        );
        onClose();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const errorOf = (field: TextField): string | undefined =>
    errors[ERROR_PATHS[field]];

  /** Props for a text control bound to `field`. */
  const bind = (field: TextField) => ({
    id: `gathering-${field}`,
    value: form[field],
    "aria-invalid": errorOf(field) !== undefined,
    "aria-describedby": errorOf(field) ? `gathering-${field}-error` : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [field]: event.target.value }),
  });

  const parsedLocation = parseCoordinates(location);
  const locationUnreadable = location.trim() !== "" && parsedLocation === null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateGatheringForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      toast.error("Fix the highlighted fields.");
      return;
    }
    setErrors({});
    save.mutate(result.draft);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !save.isPending) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
          <DialogHeader>
            <DialogTitle>
              {gathering ? "Edit Gathering" : "Add Gathering"}
            </DialogTitle>
            <DialogDescription>
              Arabic is required; English is optional and falls back to the
              Arabic on English devices. Times are the venue&apos;s local time.
            </DialogDescription>
          </DialogHeader>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Details</legend>
            <Field
              id="gathering-titleAr"
              label="Title (Arabic)"
              error={errorOf("titleAr")}
            >
              <Input {...bind("titleAr")} dir="rtl" lang="ar" />
            </Field>
            <Field
              id="gathering-titleEn"
              label="Title (English, optional)"
              error={errorOf("titleEn")}
            >
              <Input {...bind("titleEn")} />
            </Field>
            <Field
              id="gathering-descriptionAr"
              label="Description (Arabic, optional)"
              error={errorOf("descriptionAr")}
            >
              <Textarea
                {...bind("descriptionAr")}
                dir="rtl"
                lang="ar"
                rows={4}
              />
            </Field>
            <Field
              id="gathering-descriptionEn"
              label="Description (English, optional)"
              error={errorOf("descriptionEn")}
            >
              <Textarea {...bind("descriptionEn")} rows={4} />
            </Field>
            <Field id="gathering-type" label="Type" error={errorOf("type")}>
              <NativeSelect
                id="gathering-type"
                className="w-full"
                value={form.type}
                onChange={(event) => {
                  const { value } = event.target;
                  if (isGatheringType(value)) {
                    setForm({ ...form, type: value });
                  }
                }}
              >
                {GATHERING_TYPES.map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field
              id="gathering-speakerId"
              label="Speaker"
              error={errorOf("speakerId")}
            >
              <NativeSelect
                id="gathering-speakerId"
                className="w-full"
                value={form.speakerId}
                aria-invalid={errorOf("speakerId") !== undefined}
                onChange={(event) =>
                  setForm({ ...form, speakerId: event.target.value })
                }
              >
                <NativeSelectOption value="">No Speaker</NativeSelectOption>
                {speakers.map((speaker) => (
                  <NativeSelectOption key={speaker.id} value={speaker.id}>
                    {speaker.name.en
                      ? `${speaker.name.ar} (${speaker.name.en})`
                      : speaker.name.ar}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className="mb-2 text-sm font-medium">When</legend>
            <Field id="gathering-date" label="Date" error={errorOf("date")}>
              <Input {...bind("date")} type="date" />
            </Field>
            <Field
              id="gathering-startTime"
              label="Starts"
              error={errorOf("startTime")}
            >
              <Input {...bind("startTime")} type="time" />
            </Field>
            <Field
              id="gathering-endTime"
              label="Ends (optional)"
              error={errorOf("endTime")}
            >
              <Input {...bind("endTime")} type="time" />
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Venue</legend>
            <Field
              id="gathering-venueNameAr"
              label="Venue name (Arabic)"
              error={errorOf("venueNameAr")}
            >
              <Input {...bind("venueNameAr")} dir="rtl" lang="ar" />
            </Field>
            <Field
              id="gathering-venueNameEn"
              label="Venue name (English, optional)"
              error={errorOf("venueNameEn")}
            >
              <Input {...bind("venueNameEn")} />
            </Field>
            <Field
              id="gathering-address"
              label="Address (optional)"
              error={errorOf("address")}
              className="sm:col-span-2"
            >
              <Input {...bind("address")} />
            </Field>
            <Field
              id="gathering-location"
              label="Paste a location"
              hint='A "latitude, longitude" pair or a Google or Apple Maps link; fills both coordinates.'
              error={
                locationUnreadable
                  ? "No coordinates found. Open a short link first and copy the full one."
                  : undefined
              }
              className="sm:col-span-2"
            >
              <Input
                id="gathering-location"
                value={location}
                placeholder="24.7136, 46.6753"
                aria-invalid={locationUnreadable}
                onChange={(event) => {
                  const text = event.target.value;
                  setLocation(text);
                  const point = parseCoordinates(text);
                  if (point) {
                    setForm({
                      ...form,
                      latitude: String(point.latitude),
                      longitude: String(point.longitude),
                    });
                  }
                }}
              />
            </Field>
            <Field
              id="gathering-latitude"
              label="Latitude"
              error={errorOf("latitude")}
            >
              <Input
                {...bind("latitude")}
                type="number"
                step="any"
                min={-90}
                max={90}
              />
            </Field>
            <Field
              id="gathering-longitude"
              label="Longitude"
              error={errorOf("longitude")}
            >
              <Input
                {...bind("longitude")}
                type="number"
                step="any"
                min={-180}
                max={180}
              />
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Attending</legend>
            <Field
              id="gathering-attendance"
              label="Who may attend"
              error={errorOf("attendance")}
            >
              <NativeSelect
                id="gathering-attendance"
                className="w-full"
                value={form.attendance}
                onChange={(event) => {
                  const { value } = event.target;
                  if (isAttendance(value)) {
                    setForm({ ...form, attendance: value });
                  }
                }}
              >
                {ATTENDANCE.map((attendance) => (
                  <NativeSelectOption key={attendance} value={attendance}>
                    {ATTENDANCE_LABELS[attendance]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field
              id="gathering-livestreamUrl"
              label="Livestream link (optional)"
              error={errorOf("livestreamUrl")}
            >
              <Input
                {...bind("livestreamUrl")}
                type="url"
                placeholder="https://"
              />
            </Field>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="gathering-active"
                checked={form.active}
                onCheckedChange={(active) => setForm({ ...form, active })}
              />
              <label htmlFor="gathering-active" className="text-sm">
                Active: shown on devices
              </label>
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
