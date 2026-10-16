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
  pending,
  onConfirm,
  onCancel,
}: {
  /** The voice about to be deleted; null keeps the dialog closed. */
  name: string | null;
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
        <AlertDialogDescription>
          The voice leaves the list on every device at its next sync, and alerts
          that used it fall back to the system sound. Believers who already
          downloaded it can delete the files on the Storage screen.
        </AlertDialogDescription>
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
