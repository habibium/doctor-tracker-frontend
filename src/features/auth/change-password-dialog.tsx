"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { newPasswordSchema, PASSWORD_MIN } from "@/features/users/password";
import { authClient } from "@/lib/auth-client";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "This doesn't match the new password",
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password you aren't using now",
  });
type Values = z.infer<typeof schema>;

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change your password</DialogTitle>
          <DialogDescription>
            You stay signed in here. Every other device is signed out.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted with the dialog, so every opening starts empty. */}
        <ChangePasswordForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit({ currentPassword, newPassword }: Values) {
    // The API signs out other devices whatever this says; it is set for clarity.
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    if (!error) {
      toast.add({ type: "success", title: "Password changed", description: "Other devices were signed out." });
      onDone();
      return;
    }
    if (error.code === "INVALID_PASSWORD") {
      form.setError("currentPassword", { message: "That isn't your current password" });
    } else if (error.code === "PASSWORD_TOO_SHORT" || error.code === "PASSWORD_TOO_LONG") {
      form.setError("newPassword", { message: error.message ?? "This password isn't allowed" });
    } else {
      form.setError("root", {
        message:
          error.status === 429
            ? "Too many attempts. Wait a minute, then try again."
            : "Your password wasn't changed. Check your connection and try again.",
      });
    }
  }

  const visibility = (
    <InputGroupAddon align="inline-end">
      <InputGroupButton
        size="icon-xs"
        aria-label={visible ? "Hide passwords" : "Show passwords"}
        onClick={() => setVisible((shown) => !shown)}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </InputGroupButton>
    </InputGroupAddon>
  );
  const type = visible ? "text" : "password";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Field data-invalid={Boolean(errors.currentPassword)}>
          <FieldLabel htmlFor="current-password">Current password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="current-password"
              type={type}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              {...form.register("currentPassword")}
            />
            {visibility}
          </InputGroup>
          <FieldError errors={[errors.currentPassword]} />
        </Field>
        <Field data-invalid={Boolean(errors.newPassword)}>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <Input
            id="new-password"
            type={type}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            {...form.register("newPassword")}
          />
          <FieldDescription>At least {PASSWORD_MIN} characters.</FieldDescription>
          <FieldError errors={[errors.newPassword]} />
        </Field>
        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel htmlFor="confirm-password">Repeat new password</FieldLabel>
          <Input
            id="confirm-password"
            type={type}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...form.register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Change password
        </Button>
      </DialogFooter>
    </form>
  );
}
