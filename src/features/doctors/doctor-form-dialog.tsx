"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import type { Doctor } from "@/lib/api";
import { applyApiErrors } from "@/lib/form-errors";
import { doctorQueries, useCreateDoctor, useUpdateDoctor } from "./queries";
import { doctorFormSchema, type DoctorFormValues } from "./schema";

const EMPTY: DoctorFormValues = { name: "", specialization: "", hospital: "", phone: "", email: "" };

interface DoctorFormDialogProps {
  /** Omit to add a new doctor. */
  doctor?: Doctor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DoctorFormDialog({ doctor, open, onOpenChange }: DoctorFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{doctor ? "Edit doctor" : "Add a doctor"}</DialogTitle>
          <DialogDescription>
            {doctor
              ? "Update this doctor's details."
              : "The doctor appears in the list as soon as you save."}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted with the dialog, so every opening starts from current values. */}
        <DoctorForm doctor={doctor} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DoctorForm({ doctor, onDone }: { doctor?: Doctor; onDone: () => void }) {
  const create = useCreateDoctor();
  const update = useUpdateDoctor(doctor?.id ?? "");
  const { data: suggestions } = useQuery(doctorQueries.filters());

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: doctor ?? EMPTY,
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: DoctorFormValues) {
    try {
      await (doctor ? update.mutateAsync(values) : create.mutateAsync(values));
      toast.add({ type: "success", title: doctor ? "Changes saved" : "Doctor added" });
      onDone();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  const field = (name: keyof DoctorFormValues) => ({
    id: `doctor-${name}`,
    "aria-invalid": Boolean(errors[name]),
    ...form.register(name),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="doctor-name">Full name</FieldLabel>
          <Input autoComplete="off" {...field("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.specialization)}>
            <FieldLabel htmlFor="doctor-specialization">Specialization</FieldLabel>
            <Input list="doctor-specializations" autoComplete="off" {...field("specialization")} />
            <datalist id="doctor-specializations">
              {suggestions?.specializations.map((value) => <option key={value} value={value} />)}
            </datalist>
            <FieldError errors={[errors.specialization]} />
          </Field>

          <Field data-invalid={Boolean(errors.hospital)}>
            <FieldLabel htmlFor="doctor-hospital">Hospital</FieldLabel>
            <Input list="doctor-hospitals" autoComplete="off" {...field("hospital")} />
            <datalist id="doctor-hospitals">
              {suggestions?.hospitals.map((value) => <option key={value} value={value} />)}
            </datalist>
            <FieldError errors={[errors.hospital]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.phone)}>
            <FieldLabel htmlFor="doctor-phone">Phone</FieldLabel>
            <Input type="tel" autoComplete="off" placeholder="+8801711123456" {...field("phone")} />
            <FieldError errors={[errors.phone]} />
          </Field>

          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="doctor-email">Email</FieldLabel>
            <Input type="email" autoComplete="off" {...field("email")} />
            <FieldError errors={[errors.email]} />
          </Field>
        </div>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {doctor ? "Save changes" : "Add doctor"}
        </Button>
      </DialogFooter>
    </form>
  );
}
