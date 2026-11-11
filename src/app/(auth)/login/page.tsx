import { Suspense } from "react";
import type { Metadata } from "next";
import { BrandLockup, Logo } from "@/components/brand";
import { crossPath } from "@/components/page-motif";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

/** Cross outlines radiating from the logo, in a 1400 × 1400 box drawn at 56rem. */
const RINGS = [360, 480, 600, 720, 840, 960].map((size) =>
  crossPath(700, 700, size, size * 0.2, size * 0.16, size * 0.07),
);

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
        className="relative isolate m-3 hidden overflow-hidden rounded-[2rem] bg-brand-panel p-12 text-brand-panel-foreground lg:block xl:p-14"
      >
        <div className="pointer-events-none absolute top-[60%] left-[68%] -z-10 size-[56rem] -translate-x-1/2 -translate-y-1/2">
          <svg viewBox="0 0 1400 1400" className="size-full" focusable="false">
            {RINGS.map((d, index) => (
              <path
                key={index}
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ opacity: 0.24 - index * 0.03 }}
              />
            ))}
          </svg>
          {/* Lazy, so phones, where this panel is hidden, never download it. */}
          <Logo size={160} loading="lazy" className="absolute inset-0 m-auto" />
        </div>

        <div className="flex max-w-lg flex-col gap-4">
          <p className="font-heading text-[2.625rem] leading-[1.1] font-medium tracking-tight text-balance">
            Every ward, every patient, read at a glance.
          </p>
          <p className="max-w-md text-lg text-pretty text-brand-panel-foreground/80">
            Doctors, the patients in their care and how each one is doing, in one place.
          </p>
        </div>
      </aside>
    </div>
  );
}
