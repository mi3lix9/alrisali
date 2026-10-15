import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

/** Asks before deleting `name`; stays open until the deletion settles. */
export const ConfirmDeleteDialog = ({
  name,
  description,
  pending,
  onConfirm,
  onCancel,
}: {
  /** What is about to be deleted; null keeps the dialog closed. */
  name: string | null;
  description: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <AlertDialog
    open={name !== null}
    onOpenChange={(open) => {
      if (!open && !pending) {
        onCancel();
      }
    }}
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "Deleting..." : "Delete"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
