import { useState } from "react";

import { Button } from "@/shared/ui/button";

import { moveItem } from "../utils/move-item";
import { emptyActDraft, errorsUnder } from "../utils/program-draft";
import type { ActDraft, FieldErrors } from "../utils/program-draft";
import { ActForm } from "./act-form";

interface ActsEditorProps {
  acts: readonly ActDraft[];
  onChange: (acts: ActDraft[]) => void;
  /** Errors under the Program, keyed like `acts.0.name.ar`. */
  errors: FieldErrors;
}

/** The Program's Acts in order, each opening into its form. */
export const ActsEditor = ({ acts, onChange, errors }: ActsEditorProps) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Acts</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const act = emptyActDraft();
            onChange([...acts, act]);
            setOpenId(act.id);
          }}
        >
          Add Act
        </Button>
      </div>
      {acts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No Acts yet.</p>
      ) : null}
      <ol className="flex flex-col gap-2">
        {acts.map((act, index) => {
          const actErrors = errorsUnder(errors, `acts.${index}`);
          const hasErrors = Object.keys(actErrors).length > 0;
          const isOpen = openId === act.id;
          return (
            <li key={act.id} className="border">
              <div className="flex items-center gap-3 p-3">
                <span className="text-muted-foreground w-6 text-sm">
                  {index + 1}.
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {act.name.en || "Untitled Act"}
                  </span>
                  <span
                    dir="rtl"
                    className="text-muted-foreground truncate text-start text-sm"
                  >
                    {act.name.ar}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs capitalize">
                  {act.type}
                </span>
                {hasErrors ? (
                  <span className="text-destructive text-xs">Needs fixing</span>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenId(isOpen ? null : act.id)}
                >
                  {isOpen ? "Close" : "Edit"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={index === 0}
                  aria-label="Move up"
                  onClick={() => onChange(moveItem(acts, index, index - 1))}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={index === acts.length - 1}
                  aria-label="Move down"
                  onClick={() => onChange(moveItem(acts, index, index + 1))}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    onChange(acts.filter((other) => other.id !== act.id))
                  }
                >
                  Remove
                </Button>
              </div>
              {isOpen ? (
                <div className="border-t p-4">
                  <ActForm
                    act={act}
                    errors={actErrors}
                    onChange={(changed) =>
                      onChange(
                        acts.map((other) =>
                          other.id === act.id ? changed : other
                        )
                      )
                    }
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
};
