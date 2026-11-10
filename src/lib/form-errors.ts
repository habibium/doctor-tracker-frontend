import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { ApiError, errorMessage } from "@/lib/api";

/**
 * Shows the API's validation errors on the fields they belong to. The API reports them
 * as `body.<field>`; anything that isn't about a field becomes a form-level message.
 */
export function applyApiErrors<T extends FieldValues>(form: UseFormReturn<T>, error: unknown) {
  const fields = Object.keys(form.getValues());
  let matched = false;

  if (error instanceof ApiError) {
    for (const detail of error.details) {
      const field = detail.path.replace(/^body\./, "");
      if (!fields.includes(field)) continue;
      form.setError(field as Path<T>, { message: detail.message });
      matched = true;
    }
  }
  if (!matched) form.setError("root", { message: errorMessage(error) });
}
