"use client";

import { useState } from "react";
import { EllipsisIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function PatientRowActions({ patient }: { patient: Patient }) {
  const canEdit = useCanEdit();
  const remove = useDeletePatient();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  if (!canEdit) return null;

  function confirmDelete() {
    setDialog(null);
    // The row disappears at once; a failure puts it back and says why.
    remove.mutate(patient, {
      onSuccess: () => toast.add({ type: "success", title: "Patient deleted" }),
      onError: (error) =>
        toast.add({ type: "error", title: "Patient not deleted", description: errorMessage(error) }),
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${patient.name}`} />}
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setDialog("edit")}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

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
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
