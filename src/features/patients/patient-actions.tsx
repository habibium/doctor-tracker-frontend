"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { RowActionGroups } from "@/components/data-table/row-actions";
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
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useCanEdit } from "@/components/user-provider";
import { errorMessage, type Patient, type PatientDoctor } from "@/lib/api";
import { PatientFormDialog } from "./patient-form-dialog";
import { useDeletePatient } from "./queries";

interface AddPatientButtonProps {
  /** Fixes the doctor, as on a doctor's own page. */
  doctor?: PatientDoctor;
  variant?: "default" | "outline";
}

/** The caller decides who sees this: `AdminOnly` on a page, `useCanEdit` in a client view. */
export function AddPatientButton({ doctor, variant = "default" }: AddPatientButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <PlusIcon data-icon="inline-start" />
        Add patient
      </Button>
      <PatientFormDialog doctor={doctor} open={open} onOpenChange={setOpen} />
    </>
  );
}

/**
 * Each row's actions, and the one set of dialogs they open. The three-dot menu and the
 * right-click menu both render `getActions`. Viewers get none, so their rows have no menu.
 */
export function usePatientRowActions() {
  const canEdit = useCanEdit();
  const remove = useDeletePatient();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  // Kept after closing so the dialog keeps its text while it animates out.
  const [patient, setPatient] = useState<Patient | null>(null);

  function open(type: "edit" | "delete", target: Patient) {
    setPatient(target);
    setDialog(type);
  }

  function confirmDelete(target: Patient) {
    setDialog(null);
    // The row disappears at once; a failure puts it back and says why. The promise,
    // unlike mutate's callbacks, settles even after the row has unmounted.
    remove.mutateAsync(target).then(
      () => toast.add({ type: "success", title: "Patient deleted" }),
      (error: unknown) =>
        toast.add({ type: "error", title: "Patient not deleted", description: errorMessage(error) }),
    );
  }

  const getActions = canEdit
    ? (target: Patient): RowActionGroups => [
        [{ label: "Edit", icon: PencilIcon, onSelect: () => open("edit", target) }],
        [{ label: "Delete", icon: Trash2Icon, destructive: true, onSelect: () => open("delete", target) }],
      ]
    : undefined;

  const dialogs = patient && (
    <>
      {dialog === "edit" && (
        <PatientFormDialog patient={patient} open onOpenChange={() => setDialog(null)} />
      )}
      <AlertDialog open={dialog === "delete"} onOpenChange={() => setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {patient.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {patient.doctor
                ? `They are removed from ${patient.doctor.name}'s list and their record is deleted. This can't be undone.`
                : "Their record is deleted for good. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => confirmDelete(patient)}>
              Delete patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return { getActions, dialogs };
}
