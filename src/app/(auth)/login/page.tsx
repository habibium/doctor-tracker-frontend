import { Suspense } from "react";
import type { Metadata } from "next";
import { BrandLockup } from "@/components/brand";
import { crossPath } from "@/components/page-motif";
import { LoginForm } from "@/features/auth/login-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

/** Each ward is a share of stable, recovering, observed and critical patients. */
const WARDS = [
  { name: "Cardiology", shares: [52, 24, 16, 8], patients: 128 },
  { name: "Neurology", shares: [38, 34, 18, 10], patients: 96 },
  { name: "Pediatrics", shares: [61, 21, 12, 6], patients: 142 },
  { name: "Orthopedics", shares: [44, 31, 17, 8], patients: 87 },
  { name: "Oncology", shares: [35, 29, 22, 14], patients: 64 },
  { name: "Respiratory", shares: [48, 30, 15, 7], patients: 110 },
];

const CONDITIONS = [
  { label: "Stable", fill: "bg-condition-stable" },
  { label: "Recovering", fill: "bg-condition-recovering" },
  { label: "Under observation", fill: "bg-condition-observation" },
  { label: "Critical", fill: "bg-condition-critical" },
];

const RINGS = [180, 300, 420, 540, 660, 780].map((size) =>
  crossPath(700, 700, size, size * 0.2, size * 0.16, size * 0.07),
);

function WardCensus() {
  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-card p-6 text-card-foreground shadow-xl shadow-black/15">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-heading text-lg font-medium">Ward census</p>
        <p className="text-sm text-muted-foreground">Patients in care</p>
      </div>
      <ul className="flex flex-col gap-3.5">
        {WARDS.map((ward) => (
          <li key={ward.name} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-4 text-sm">
            <span className="truncate text-muted-foreground">{ward.name}</span>
            <span className="flex h-2.5 gap-0.5">
              {ward.shares.map((share, index) => (
                <span
                  key={index}
                  className={cn("rounded-full", CONDITIONS[index]?.fill)}
                  style={{ width: `${share}%` }}
                />
              ))}
            </span>
            <span className="tabular text-right font-medium">{ward.patients}</span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
        {CONDITIONS.map(({ label, fill }) => (
          <li key={label} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", fill)} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <main className="flex flex-col px-6 py-6 sm:px-10 sm:py-8">
        <BrandLockup size="md" />

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-12">
          <div className="flex flex-col gap-2">
            <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">Sign in</h1>
            <p className="text-pretty text-muted-foreground">
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
        className="relative isolate m-3 hidden flex-col justify-between gap-12 overflow-hidden rounded-[2rem] bg-brand-panel p-12 text-brand-panel-foreground lg:flex xl:p-14"
      >
        <svg
          viewBox="0 0 1400 1400"
          className="pointer-events-none absolute top-[44%] -right-[20rem] -z-10 size-[56rem] -translate-y-1/2 text-brand-panel-foreground"
          focusable="false"
        >
          <path d={RINGS[0]} className="fill-motif-mint" />
          {RINGS.map((d, index) => (
            <path
              key={index}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ opacity: 0.22 - index * 0.03 }}
            />
          ))}
        </svg>

        <div className="flex max-w-lg flex-col gap-4">
          <p className="font-heading text-[2.625rem] leading-[1.1] font-medium tracking-tight text-balance">
            Every ward, every patient, read at a glance.
          </p>
          <p className="max-w-md text-lg text-pretty text-brand-panel-foreground/80">
            Doctors, the patients in their care and how each one is doing, in one place.
          </p>
        </div>

        <div className="max-w-xl">
          <WardCensus />
        </div>
      </aside>
    </div>
  );
}
