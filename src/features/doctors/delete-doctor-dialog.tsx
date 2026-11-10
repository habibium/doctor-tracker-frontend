"use client";

import Link from "next/link";
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
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { type Doctor, errorMessage } from "@/lib/api";
import { useDeleteDoctor } from "./queries";

interface DeleteDoctorDialogProps {
  doctor: Doctor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteDoctorDialog({ doctor, open, onOpenChange, onDeleted }: DeleteDoctorDialogProps) {
  const remove = useDeleteDoctor();
  const hasPatients = doctor.patientCount > 0;

  function confirm() {
    remove.mutate(doctor.id, {
      onSuccess: () => {
        toast.add({ type: "success", title: "Doctor deleted" });
        onOpenChange(false);
        onDeleted?.();
      },
      onError: (error) => {
        toast.add({ type: "error", title: "Doctor not deleted", description: errorMessage(error) });
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasPatients ? `${doctor.name} still has patients` : `Delete ${doctor.name}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasPatients
              ? `Move or remove their ${doctor.patientCount} patients first. A doctor can only be deleted once no patients are assigned.`
              : "Their record is removed for good. This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{hasPatients ? "Close" : "Cancel"}</AlertDialogCancel>
          {hasPatients ? (
            <Button nativeButton={false} render={<Link href={`/doctors/${doctor.id}`} />}>
              View patients
            </Button>
          ) : (
            <AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={confirm}>
              {remove.isPending && <Spinner data-icon="inline-start" />}
              Delete doctor
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
