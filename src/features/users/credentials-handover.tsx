"use client";

import { type ReactNode, useState } from "react";
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "./use-copy";

interface CredentialsHandoverProps {
  email: string;
  password: string;
}

/**
 * The one moment the admin can see a password they set. It is masked until asked for,
 * since this is often on a shared screen, and each value copies on its own.
 */
export function CredentialsHandover({ email, password }: CredentialsHandoverProps) {
  const [shown, setShown] = useState(false);
  const { copied, copy } = useCopy();

  return (
    <div className="flex flex-col gap-3">
      <dl className="flex flex-col divide-y rounded-3xl border bg-muted/40">
        <CredentialRow
          label="Email"
          value={<span className="break-all">{email}</span>}
          copyLabel="Copy email"
          copied={copied === "email"}
          onCopy={() => void copy("email", email, "Email")}
        />
        <CredentialRow
          label="Password"
          value={
            shown ? (
              <span className="font-mono tracking-wide break-all">{password}</span>
            ) : (
              <>
                <span className="sr-only">Hidden</span>
                <span aria-hidden="true" className="font-mono tracking-wide">
                  {"•".repeat(password.length)}
                </span>
              </>
            )
          }
          copyLabel="Copy password"
          copied={copied === "password"}
          onCopy={() => void copy("password", password, "Password")}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={shown ? "Hide password" : "Show password"}
            onClick={() => setShown((value) => !value)}
          >
            {shown ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </CredentialRow>
      </dl>
      <Button
        variant="outline"
        onClick={() => void copy("both", `Email: ${email}\nPassword: ${password}`, "Email and password")}
      >
        {copied === "both" ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
        Copy both
      </Button>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  copyLabel,
  copied,
  onCopy,
  children,
}: {
  label: string;
  value: ReactNode;
  copyLabel: string;
  copied: boolean;
  onCopy: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 py-2.5 pr-2 pl-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="min-w-0 text-sm font-medium">{value}</dd>
      </div>
      {children}
      <Button variant="ghost" size="icon-sm" aria-label={copyLabel} onClick={onCopy}>
        {copied ? <CheckIcon className="text-brand-mint" /> : <CopyIcon />}
      </Button>
    </div>
  );
}
