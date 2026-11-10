import * as z from "zod";
import type { CreatePatient } from "@/lib/api";

/** Mirrors the API's rules with messages written for people; see the doctor schema. */
export const patientFormSchema = z.object({
  name: z.string().trim().min(2, "Enter the patient's full name").max(120, "Use 120 characters or fewer"),
  age: z
    .number({ error: "Enter the patient's age in years" })
    .int("Use a whole number of years")
    .min(0, "Age can't be negative")
    .max(130, "Enter an age of 130 or less"),
  gender: z.enum(["female", "male", "other"], { error: "Choose a gender" }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{6,18}$/, "Enter a phone number such as 01811222333"),
  condition: z.enum(["stable", "recovering", "under_observation", "critical"], {
    error: "Choose a condition",
  }),
  diagnosis: z.string().trim().min(2, "Enter a diagnosis").max(200, "Use 200 characters or fewer"),
  doctorId: z.string().min(1, "Choose the doctor in charge"),
}) satisfies z.ZodType<CreatePatient>;

export type PatientFormValues = z.infer<typeof patientFormSchema>;
