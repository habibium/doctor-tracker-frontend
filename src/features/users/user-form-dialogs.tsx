"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRoundIcon, type LucideIcon, UserRoundCheckIcon } from "lucide-react";
import {
  Controller,
  type FieldError as FieldErrorType,
  type UseFormRegisterReturn,
  useForm,
} from "react-hook-form";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CreateUser, User } from "@/lib/api";
import { applyApiErrors } from "@/lib/form-errors";
import { CredentialsHandover } from "./credentials-handover";
import { generatePassword, newPasswordSchema, PASSWORD_MIN } from "./password";
import { PasswordInput } from "./password-input";
import { useCreateUser, useResetUserPassword, useUpdateUser } from "./queries";
import { ROLE_BY_VALUE, ROLES } from "./roles";

const name = z.string().trim().min(2, "Enter their full name").max(120, "Use 120 characters or fewer");
const role = z.enum(["admin", "viewer"]);

/** Mirrors the API's rules with messages written for people, checked against the contract. */
const createSchema = z.object({
  name,
  email: z.email("Enter a valid email address").max(254, "Use 254 characters or fewer"),
  role,
  password: newPasswordSchema,
}) satisfies z.ZodType<CreateUser>;
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({ name, role });
type EditValues = z.infer<typeof editSchema>;

const passwordSchema = z.object({ password: newPasswordSchema });
type PasswordValues = z.infer<typeof passwordSchema>;

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The hand-over step after a password is set: the only time it can be read. */
function HandoverStep({
  icon: Icon,
  title,
  lead,
  email,
  password,
  onDone,
}: {
  icon: LucideIcon;
  title: string;
  lead: string;
  email: string;
  password: string;
  onDone: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <span className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {lead} Give them these details in person or over a call rather than by email. The
          password won&apos;t be shown again; they can change it from their account menu.
        </DialogDescription>
      </DialogHeader>
      <CredentialsHandover email={email} password={password} />
      <DialogFooter>
        <Button onClick={onDone}>Done</Button>
      </DialogFooter>
    </>
  );
}

function PasswordField({
  id,
  label,
  error,
  setPassword,
  ...registration
}: UseFormRegisterReturn & {
  id: string;
  label: string;
  error?: FieldErrorType;
  setPassword: (password: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <PasswordInput
        id={id}
        autoComplete="new-password"
        aria-invalid={Boolean(error)}
        visible={visible}
        onVisibleChange={setVisible}
        onGenerate={() => {
          setPassword(generatePassword());
          setVisible(true);
        }}
        {...registration}
      />
      <FieldDescription>At least {PASSWORD_MIN} characters. Generate one, or type your own.</FieldDescription>
      <FieldError errors={[error]} />
    </Field>
  );
}

/** setValue, not reset(): the React Compiler memoizes register(), so reset would not refill it. */
const fill = { shouldValidate: true, shouldDirty: true } as const;

function RoleField({
  value,
  onChange,
  disabledReason,
  hint,
}: {
  value: User["role"];
  onChange: (role: User["role"]) => void;
  disabledReason?: string;
  hint?: string;
}) {
  return (
    <Field data-disabled={Boolean(disabledReason)}>
      <FieldTitle id="user-role">Role</FieldTitle>
      <ToggleGroup
        variant="outline"
        aria-labelledby="user-role"
        disabled={Boolean(disabledReason)}
        value={[value]}
        // A click on the active option is ignored: everyone has a role.
        onValueChange={(next) => next[0] && onChange(next[0] as User["role"])}
      >
        {ROLES.map(({ value: option, label, icon: Icon }) => (
          <ToggleGroupItem key={option} value={option}>
            <Icon />
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldDescription>{disabledReason ?? hint ?? ROLE_BY_VALUE[value].description}.</FieldDescription>
    </Field>
  );
}

export function AddUserDialog({ open, onOpenChange }: DialogProps) {
  return (
    // An outside click must not throw away a password that has not been handed over.
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-lg">
        {/* Mounted with the dialog, so every opening starts from an empty form. */}
        <AddUserFlow onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AddUserFlow({ onDone }: { onDone: () => void }) {
  const create = useCreateUser();
  const [created, setCreated] = useState<{ user: User; password: string } | null>(null);

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", role: "viewer", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  if (created) {
    return (
      <HandoverStep
        icon={UserRoundCheckIcon}
        title={`${created.user.name} can sign in now`}
        lead={`Their account is ready as ${ROLE_BY_VALUE[created.user.role].label.toLowerCase()}.`}
        email={created.user.email}
        password={created.password}
        onDone={onDone}
      />
    );
  }

  async function onSubmit(values: CreateValues) {
    try {
      const user = await create.mutateAsync(values);
      setCreated({ user, password: values.password });
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add a user</DialogTitle>
        <DialogDescription>
          They sign in with this email and the password you set here.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {errors.root && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="user-name">Full name</FieldLabel>
              <Input id="user-name" autoComplete="off" aria-invalid={Boolean(errors.name)} {...form.register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="user-email">Email</FieldLabel>
              <Input
                id="user-email"
                type="email"
                autoComplete="off"
                aria-invalid={Boolean(errors.email)}
                {...form.register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
          </div>
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => <RoleField value={field.value} onChange={field.onChange} />}
          />
          <PasswordField
            id="user-password"
            label="Initial password"
            error={errors.password}
            setPassword={(password) => form.setValue("password", password, fill)}
            {...form.register("password")}
          />
        </FieldGroup>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Add user
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function EditUserDialog({ user, self, open, onOpenChange }: DialogProps & { user: User; self: boolean }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {self ? "your details" : user.name}</DialogTitle>
          <DialogDescription>
            Signs in as <span className="font-medium text-foreground">{user.email}</span>. An email
            can&apos;t be changed; add a new user instead.
          </DialogDescription>
        </DialogHeader>
        <EditUserForm user={user} self={self} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditUserForm({ user, self, onDone }: { user: User; self: boolean; onDone: () => void }) {
  const update = useUpdateUser();
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: user.name, role: user.role },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: EditValues) {
    try {
      await update.mutateAsync({
        id: user.id,
        body: { name: values.name, ...(values.role !== user.role && { role: values.role }) },
      });
      toast.add({ type: "success", title: "Changes saved" });
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
          <FieldLabel htmlFor="user-name">Full name</FieldLabel>
          <Input id="user-name" autoComplete="off" aria-invalid={Boolean(errors.name)} {...form.register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <RoleField
              value={field.value}
              onChange={field.onChange}
              disabledReason={self ? "You can't change your own role. Another admin can" : undefined}
              hint={
                field.value !== user.role
                  ? "They'll be signed out everywhere, and sign in again with the new role"
                  : undefined
              }
            />
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ResetPasswordDialog({ user, open, onOpenChange }: DialogProps & { user: User }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-lg">
        <ResetPasswordFlow user={user} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordFlow({ user, onDone }: { user: User; onDone: () => void }) {
  const reset = useResetUserPassword(user.id);
  const [password, setPassword] = useState<string | null>(null);
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  if (password) {
    return (
      <HandoverStep
        icon={KeyRoundIcon}
        title={`New password for ${user.name}`}
        lead="Their old password no longer works, and they were signed out everywhere."
        email={user.email}
        password={password}
        onDone={onDone}
      />
    );
  }

  async function onSubmit(values: PasswordValues) {
    try {
      await reset.mutateAsync(values.password);
      setPassword(values.password);
    } catch (error) {
      applyApiErrors(form, error);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reset {user.name}&apos;s password</DialogTitle>
        <DialogDescription>
          Their current password stops working and they&apos;re signed out everywhere at once.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {errors.root && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}
        <PasswordField
          id="reset-password"
          label="New password"
          error={errors.password}
          setPassword={(password) => form.setValue("password", password, fill)}
          {...form.register("password")}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Set password
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
