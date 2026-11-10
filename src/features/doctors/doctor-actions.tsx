"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EllipsisIcon, EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCanEdit } from "@/components/user-provider";
import type { Doctor } from "@/lib/api";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";
import { DoctorFormDialog } from "./doctor-form-dialog";

export function AddDoctorButton() {
  const canEdit = useCanEdit();
  const [open, setOpen] = useState(false);
  if (!canEdit) return null;

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

/** The per-row menu. Each row owns its dialogs, so the column list needs no callbacks. */
export function DoctorRowActions({ doctor }: { doctor: Doctor }) {
  const canEdit = useCanEdit();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${doctor.name}`} />}
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href={`/doctors/${doctor.id}`} />}>
              <EyeIcon />
              View profile
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={() => setDialog("edit")}>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "edit" && (
        <DoctorFormDialog doctor={doctor} open onOpenChange={() => setDialog(null)} />
      )}
      {dialog === "delete" && (
        <DeleteDoctorDialog doctor={doctor} open onOpenChange={() => setDialog(null)} />
      )}
    </>
  );
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
