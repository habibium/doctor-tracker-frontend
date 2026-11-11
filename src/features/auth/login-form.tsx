"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type LoginValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    access: "Full access",
    email: "admin@doctortracker.dev",
    password: "Admin@12345",
    icon: ShieldCheckIcon,
    chip: "bg-primary/10 text-primary dark:bg-primary/15",
  },
  {
    label: "Viewer",
    access: "Read only",
    email: "viewer@doctortracker.dev",
    password: "Viewer@12345",
    icon: EyeIcon,
    chip: "bg-accent text-accent-foreground",
  },
];

/** Only same-site paths are followed, so `?next=` cannot send someone to another site. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function LoginForm() {
  const next = safeNext(useSearchParams().get("next"));
  const { data: session } = authClient.useSession();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (session) window.location.replace(next);
  }, [session, next]);

  function fillDemoAccount(email: string, password: string) {
    // Not reset(): it refills inputs only when they register again, and the React
    // Compiler memoizes register(), so the fields would stay empty.
    form.clearErrors();
    form.setValue("email", email);
    form.setValue("password", password);
  }

  async function onSubmit(values: LoginValues) {
    const { error } = await authClient.signIn.email(values);
    if (!error) {
      // A full navigation so every server component renders with the new session.
      window.location.assign(next);
      return;
    }
    form.setError("root", {
      message:
        error.status === 429
          ? "Too many attempts. Wait a minute, then try again."
          : error.status === 401
            ? "That email and password don't match an account."
            : "Sign-in failed. Check your connection and try again.",
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            aria-invalid={Boolean(errors.email)}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...form.register("password")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Spinner data-icon="inline-start" />}
        Sign in
      </Button>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Or try a demo account
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map(({ label, access, email, password, icon: Icon, chip }) => (
            <Button
              key={email}
              type="button"
              variant="outline"
              className="h-auto justify-start gap-3 rounded-2xl px-3 py-2.5 text-left"
              onClick={() => fillDemoAccount(email, password)}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", chip)}>
                <Icon />
              </span>
              <span className="flex min-w-0 flex-col">
                <span>{label}</span>
                <span className="text-xs font-normal text-muted-foreground">{access}</span>
              </span>
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}
