import { Suspense } from "react";
import type { Metadata } from "next";
import { ActivityIcon } from "lucide-react";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

/** Each row is a ward: a share of stable, recovering, observed and critical patients. */
const WARD_ROWS = [
  [52, 24, 16, 8],
  [38, 34, 18, 10],
  [61, 21, 12, 6],
  [44, 28, 17, 11],
  [57, 25, 13, 5],
  [35, 31, 22, 12],
  [48, 30, 15, 7],
];

const SEGMENT_COLORS = [
  "bg-condition-stable",
  "bg-condition-recovering",
  "bg-condition-observation",
  "bg-condition-critical",
];

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ActivityIcon className="size-5" />
            </span>
            <span className="font-heading text-lg font-semibold">Doctor Tracker</span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-muted-foreground">
              Manage doctors and the patients in their care.
            </p>
          </div>

          {/* The form reads ?next= from the URL, which is only known at request time. */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <aside
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex"
      >
        <p className="max-w-md font-heading text-4xl leading-tight font-medium tracking-tight text-balance">
          Every ward, every patient, read at a glance.
        </p>

        <div className="flex flex-col gap-3">
          {WARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex h-7 gap-0.5">
              {row.map((share, index) => (
                <div
                  key={index}
                  className={`rounded ${SEGMENT_COLORS[index]}`}
                  style={{ width: `${share}%` }}
                />
              ))}
            </div>
          ))}
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {["Stable", "Recovering", "Under observation", "Critical"].map((label, index) => (
            <li key={label} className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${SEGMENT_COLORS[index]}`} />
              {label}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
