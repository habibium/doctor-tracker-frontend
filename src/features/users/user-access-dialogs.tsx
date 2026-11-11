"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { errorMessage, type User } from "@/lib/api";
import { useDeleteUser, useUpdateUser } from "./queries";

interface AccessDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Reversible, so it is a plain action rather than a red one. */
export function DeactivateUserDialog({ user, open, onOpenChange }: AccessDialogProps) {
  const update = useUpdateUser();

  function confirm() {
    update.mutate(
      { id: user.id, body: { status: "deactivated" } },
      {
        onSuccess: () => {
          toast.add({ type: "success", title: `${user.name} is deactivated`, description: "They were signed out everywhere." });
          onOpenChange(false);
        },
        onError: (error) => {
          toast.add({ type: "error", title: "Not deactivated", description: errorMessage(error) });
        },
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate {user.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            They&apos;re signed out everywhere at once and can&apos;t sign in until an admin
            reactivates them. Their account is kept, so you can undo this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={update.isPending} onClick={confirm}>
            {update.isPending && <Spinner data-icon="inline-start" />}
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteUserDialog({ user, open, onOpenChange }: AccessDialogProps) {
  const remove = useDeleteUser();

  function confirm() {
    remove.mutate(user.id, {
      onSuccess: () => {
        toast.add({ type: "success", title: "User deleted" });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.add({ type: "error", title: "User not deleted", description: errorMessage(error) });
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Their account is removed for good and they&apos;re signed out at once. To pause their
            access instead, deactivate them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={confirm}>
            {remove.isPending && <Spinner data-icon="inline-start" />}
            Delete user
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
