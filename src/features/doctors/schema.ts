import * as z from "zod";
import type { CreateDoctor } from "@/lib/api";

/**
 * Mirrors the API's rules with messages written for people. `satisfies` ties the
 * shape to the generated contract: if the API adds a field, this stops compiling.
 */
export const doctorFormSchema = z.object({
  name: z.string().trim().min(2, "Enter the doctor's full name").max(120, "Use 120 characters or fewer"),
  specialization: z.string().trim().min(2, "Enter a specialization").max(80, "Use 80 characters or fewer"),
  hospital: z.string().trim().min(2, "Enter the hospital").max(120, "Use 120 characters or fewer"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{6,18}$/, "Enter a phone number such as +8801711123456"),
  email: z.email("Enter a valid email address").max(254, "Use 254 characters or fewer"),
}) satisfies z.ZodType<CreateDoctor>;

export type DoctorFormValues = z.infer<typeof doctorFormSchema>;
