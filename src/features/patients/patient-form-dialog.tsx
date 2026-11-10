"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import { Field, FieldError, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DoctorCombobox } from "@/features/doctors/doctor-combobox";
import type { Patient, PatientDoctor } from "@/lib/api";
import { applyApiErrors } from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import { CONDITIONS, GENDERS } from "./conditions";
import { useCreatePatient, useUpdatePatient } from "./queries";
import { patientFormSchema, type PatientFormValues } from "./schema";

interface PatientFormDialogProps {
  /** Omit to add a new patient. */
  patient?: Patient;
  /** Fixes the doctor for a new patient, as on a doctor's own page. */
  doctor?: PatientDoctor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientFormDialog({ patient, doctor, open, onOpenChange }: PatientFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{patient ? "Edit patient" : "Add a patient"}</DialogTitle>
          <DialogDescription>
            {patient
              ? "Update this patient's details or move them to another doctor."
              : doctor
                ? `The patient is added to ${doctor.name}'s list.`
                : "Every patient is assigned to a doctor."}
          </DialogDescription>
        </DialogHeader>
        <PatientForm patient={patient} fixedDoctor={doctor} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface PatientFormProps {
  patient?: Patient;
  fixedDoctor?: PatientDoctor;
  onDone: () => void;
}

function PatientForm({ patient, fixedDoctor, onDone }: PatientFormProps) {
  const create = useCreatePatient();
  const update = useUpdatePatient(patient?.id ?? "");
  // The form stores only the id; the picker needs the whole record to show a name.
  const [doctor, setDoctor] = useState<PatientDoctor | null>(fixedDoctor ?? patient?.doctor ?? null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: patient?.name ?? "",
      age: patient?.age,
      gender: patient?.gender,
      phone: patient?.phone ?? "",
      condition: patient?.condition ?? "stable",
      diagnosis: patient?.diagnosis ?? "",
      doctorId: doctor?.id ?? "",
    },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: PatientFormValues) {
    try {
      await (patient ? update.mutateAsync(values) : create.mutateAsync(values));
      toast.add({ type: "success", title: patient ? "Changes saved" : "Patient added" });
      onDone();
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="patient-name">Full name</FieldLabel>
          <Input
            id="patient-name"
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            {...form.register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
          <Field data-invalid={Boolean(errors.age)}>
            <FieldLabel htmlFor="patient-age">Age</FieldLabel>
            <Input
              id="patient-age"
              type="number"
              inputMode="numeric"
              min={0}
              max={130}
              aria-invalid={Boolean(errors.age)}
              {...form.register("age", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.age]} />
          </Field>

          <Field data-invalid={Boolean(errors.phone)}>
            <FieldLabel htmlFor="patient-phone">Phone</FieldLabel>
            <Input
              id="patient-phone"
              type="tel"
              autoComplete="off"
              placeholder="01811222333"
              aria-invalid={Boolean(errors.phone)}
              {...form.register("phone")}
            />
            <FieldError errors={[errors.phone]} />
          </Field>
        </div>

        <Controller
          control={form.control}
          name="gender"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldTitle id="patient-gender">Gender</FieldTitle>
              <ToggleGroup
                variant="outline"
                aria-labelledby="patient-gender"
                value={field.value ? [field.value] : []}
                onValueChange={(value) => field.onChange(value[0])}
              >
                {GENDERS.map(({ value, label }) => (
                  <ToggleGroupItem key={value} value={value}>
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="condition"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldTitle id="patient-condition">Condition</FieldTitle>
              <ToggleGroup
                variant="outline"
                aria-labelledby="patient-condition"
                className="flex-wrap"
                value={[field.value]}
                // Ignore a click on the active option: a patient always has a condition.
                onValueChange={(value) => value[0] && field.onChange(value[0])}
              >
                {CONDITIONS.map(({ value, label, fill }) => (
                  <ToggleGroupItem key={value} value={value}>
                    <span aria-hidden="true" className={cn("size-2 rounded-full", fill)} />
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Field data-invalid={Boolean(errors.diagnosis)}>
          <FieldLabel htmlFor="patient-diagnosis">Diagnosis</FieldLabel>
          <Input
            id="patient-diagnosis"
            autoComplete="off"
            aria-invalid={Boolean(errors.diagnosis)}
            {...form.register("diagnosis")}
          />
          <FieldError errors={[errors.diagnosis]} />
        </Field>

        {!fixedDoctor && (
          <Field data-invalid={Boolean(errors.doctorId)}>
            <FieldLabel htmlFor="patient-doctor">Doctor</FieldLabel>
            <DoctorCombobox
              id="patient-doctor"
              value={doctor}
              invalid={Boolean(errors.doctorId)}
              onChange={(next) => {
                setDoctor(next);
                form.setValue("doctorId", next?.id ?? "", { shouldValidate: true, shouldDirty: true });
              }}
            />
            <FieldError errors={[errors.doctorId]} />
          </Field>
        )}
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {patient ? "Save changes" : "Add patient"}
        </Button>
      </DialogFooter>
    </form>
  );
}
