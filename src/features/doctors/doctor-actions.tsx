"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { RowAction, RowActionGroups } from "@/components/data-table/row-actions";
import { Button } from "@/components/ui/button";
import { useCanEdit } from "@/components/user-provider";
import type { Doctor } from "@/lib/api";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";
import { DoctorFormDialog } from "./doctor-form-dialog";

/** The caller decides who sees this; the page wraps it in `AdminOnly`. */
export function AddDoctorButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Add doctor
      </Button>
      <DoctorFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

type RowDialog = { type: "edit" | "delete"; doctor: Doctor };

/**
 * Each row's actions, and the one set of dialogs they open. The three-dot menu and the
 * right-click menu both render `getActions`, so they offer exactly the same thing.
 */
export function useDoctorRowActions() {
  const canEdit = useCanEdit();
  const [dialog, setDialog] = useState<RowDialog | null>(null);

  const getActions = (doctor: Doctor): RowActionGroups => {
    const view: RowAction = { label: "View profile", icon: EyeIcon, href: `/doctors/${doctor.id}` };
    if (!canEdit) return [[view]];
    return [
      [view, { label: "Edit", icon: PencilIcon, onSelect: () => setDialog({ type: "edit", doctor }) }],
      [
        {
          label: "Delete",
          icon: Trash2Icon,
          destructive: true,
          onSelect: () => setDialog({ type: "delete", doctor }),
        },
      ],
    ];
  };

  const dialogs = (
    <>
      {dialog?.type === "edit" && (
        <DoctorFormDialog doctor={dialog.doctor} open onOpenChange={() => setDialog(null)} />
      )}
      {dialog?.type === "delete" && (
        <DeleteDoctorDialog doctor={dialog.doctor} open onOpenChange={() => setDialog(null)} />
      )}
    </>
  );

  return { getActions, dialogs };
}

/** Edit and delete for the profile page; deleting returns to the list. */
export function DoctorProfileActions({ doctor }: { doctor: Doctor }) {
  const canEdit = useCanEdit();
  const router = useRouter();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  if (!canEdit) return null;

  return (
    <>
      <Button variant="outline" onClick={() => setDialog("edit")}>
        <PencilIcon data-icon="inline-start" />
        Edit
      </Button>
      <Button variant="destructive" onClick={() => setDialog("delete")}>
        <Trash2Icon data-icon="inline-start" />
        Delete
      </Button>

      {dialog === "edit" && (
        <DoctorFormDialog doctor={doctor} open onOpenChange={() => setDialog(null)} />
      )}
      {dialog === "delete" && (
        <DeleteDoctorDialog
          doctor={doctor}
          open
          onOpenChange={() => setDialog(null)}
          onDeleted={() => router.replace("/doctors")}
        />
      )}
    </>
  );
}
