import type {
  OfficialProgram,
  ProgramCategory,
} from "@alrisali/domain/programs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/shared/lib/orpc";
import { Button } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";

import { ActsEditor } from "../components/acts-editor";
import {
  BilingualFields,
  CheckboxField,
  SelectField,
} from "../components/fields";
import { WindowFields } from "../components/window-fields";
import {
  emptyProgramDraft,
  errorsUnder,
  programToDraft,
  validateDraft,
} from "../utils/program-draft";
import type { FieldErrors, ProgramDraft } from "../utils/program-draft";

/** The `$id` that opens a fresh Program. */
export const NEW_PROGRAM_ID = "new";

const CATEGORY_OPTIONS = [
  { value: "general", label: "General (all year)" },
  { value: "seasonal", label: "Seasonal (a Hijri window)" },
] as const satisfies readonly { value: ProgramCategory; label: string }[];

const NO_ERRORS: FieldErrors = {};

const ProgramEditor = ({ program }: { program: OfficialProgram | null }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProgramDraft>(() =>
    program ? programToDraft(program) : emptyProgramDraft()
  );
  const [showErrors, setShowErrors] = useState(false);
  const validation = validateDraft(draft);
  const errors = showErrors && !validation.ok ? validation.errors : NO_ERRORS;

  const save = useMutation(
    orpc.programs.save.mutationOptions({
      onSuccess: async (saved) => {
        await queryClient.invalidateQueries({ queryKey: orpc.programs.key() });
        toast.success(
          `Saved ${saved.name.en}. Devices update on their next sync.`
        );
        await navigate({ to: "/admin/programs" });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const update = (changes: Partial<ProgramDraft>) =>
    setDraft((current) => ({ ...current, ...changes }));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {program ? `Edit ${program.name.en}` : "New Program"}
          </h1>
          <p className="text-muted-foreground">
            An Official Program Believers can subscribe to, with its Acts in
            order.
          </p>
        </div>
        <Link
          to="/admin/programs"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Back to Programs
        </Link>
      </div>

      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!validation.ok) {
            setShowErrors(true);
            toast.error("Fix the highlighted fields before saving.");
            return;
          }
          save.mutate(validation.program);
        }}
      >
        <section className="flex flex-col gap-4">
          <BilingualFields
            label="Name"
            value={draft.name}
            errors={errorsUnder(errors, "name")}
            onChange={(name) => update({ name })}
          />
          <BilingualFields
            label="Description"
            multiline
            value={draft.description}
            errors={errorsUnder(errors, "description")}
            onChange={(description) => update({ description })}
          />
          <SelectField
            label="Category"
            value={draft.category}
            options={CATEGORY_OPTIONS}
            onChange={(category) => update({ category })}
          />
          {draft.category === "seasonal" ? (
            <WindowFields
              value={draft.window}
              onChange={(window) => update({ window })}
            />
          ) : null}
          <CheckboxField
            label="Active (shown on devices)"
            checked={draft.active}
            onChange={(active) => update({ active })}
          />
        </section>

        <ActsEditor
          acts={draft.acts}
          errors={errors}
          onChange={(acts) => update({ acts })}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save Program"}
          </Button>
          {Object.keys(errors).length > 0 ? (
            <span className="text-destructive text-sm">
              Some fields need fixing.
            </span>
          ) : null}
        </div>
      </form>
    </main>
  );
};

export const ProgramEditScreen = ({ id }: { id: string }) => {
  const isNew = id === NEW_PROGRAM_ID;
  const current = useQuery({
    ...orpc.programs.get.queryOptions({ input: { id } }),
    enabled: !isNew,
  });

  if (isNew) {
    return <ProgramEditor key={NEW_PROGRAM_ID} program={null} />;
  }
  if (current.isPending) {
    return <Loader />;
  }
  if (current.isError) {
    return (
      <p className="text-destructive p-6">
        Could not load the Program: {current.error.message}
      </p>
    );
  }
  if (current.data === null) {
    return (
      <main className="flex flex-col gap-3 p-6">
        <p>There is no such Program.</p>
        <Link to="/admin/programs" className="underline">
          Back to Programs
        </Link>
      </main>
    );
  }
  return <ProgramEditor key={current.data.id} program={current.data} />;
};
