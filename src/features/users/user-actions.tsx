"use client";

import { useState } from "react";
import {
  KeyRoundIcon,
  PencilIcon,
  Trash2Icon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
} from "lucide-react";
import type { RowActionGroups } from "@/components/data-table/row-actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useUser } from "@/components/user-provider";
import { errorMessage, type User } from "@/lib/api";
import { useUpdateUser } from "./queries";
import { DeactivateUserDialog, DeleteUserDialog } from "./user-access-dialogs";
import { AddUserDialog, EditUserDialog, ResetPasswordDialog } from "./user-form-dialogs";

/** The caller decides who sees this; the page wraps it in `AdminOnly`. */
export function AddUserButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlusIcon data-icon="inline-start" />
        Add user
      </Button>
      <AddUserDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

type RowDialog = { type: "edit" | "password" | "deactivate" | "delete"; user: User };

/**
 * On your own row, actions that would lock you out stay visible, disabled with the reason.
 * Only another admin can remove an admin, so this also protects the last one.
 */
export function useUserRowActions() {
  const me = useUser();
  const update = useUpdateUser();
  const [dialog, setDialog] = useState<RowDialog | null>(null);

  function reactivate(user: User) {
    update.mutate(
      { id: user.id, body: { status: "active" } },
      {
        onSuccess: () => toast.add({ type: "success", title: `${user.name} can sign in again` }),
        onError: (error) =>
          toast.add({ type: "error", title: "Not reactivated", description: errorMessage(error) }),
      },
    );
  }

  const getActions = (user: User): RowActionGroups => {
    const self = user.id === me.id;
    const open = (type: RowDialog["type"]) => () => setDialog({ type, user });
    return [
      [
        { label: "Edit", icon: PencilIcon, onSelect: open("edit") },
        {
          label: "Reset password",
          icon: KeyRoundIcon,
          onSelect: open("password"),
          disabledReason: self ? "Use Change password in your account menu" : undefined,
        },
      ],
      [
        user.status === "active"
          ? {
              label: "Deactivate",
              icon: UserXIcon,
              onSelect: open("deactivate"),
              disabledReason: self ? "Only another admin can deactivate you" : undefined,
            }
          : { label: "Reactivate", icon: UserCheckIcon, onSelect: () => reactivate(user) },
        {
          label: "Delete",
          icon: Trash2Icon,
          destructive: true,
          onSelect: open("delete"),
          disabledReason: self ? "Only another admin can delete you" : undefined,
        },
      ],
    ];
  };

  const close = () => setDialog(null);
  const dialogs = (
    <>
      {dialog?.type === "edit" && (
        <EditUserDialog user={dialog.user} self={dialog.user.id === me.id} open onOpenChange={close} />
      )}
      {dialog?.type === "password" && <ResetPasswordDialog user={dialog.user} open onOpenChange={close} />}
      {dialog?.type === "deactivate" && <DeactivateUserDialog user={dialog.user} open onOpenChange={close} />}
      {dialog?.type === "delete" && <DeleteUserDialog user={dialog.user} open onOpenChange={close} />}
    </>
  );

  return { getActions, dialogs };
}
