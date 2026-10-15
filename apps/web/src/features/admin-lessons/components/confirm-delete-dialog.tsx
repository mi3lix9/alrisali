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
  /** The Lesson about to be deleted; null keeps the dialog closed. */
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
          The Lesson and its Slides leave every device on its next sync.
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
