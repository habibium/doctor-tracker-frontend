import { Suspense, type CSSProperties } from "react";
import type { Metadata } from "next";
import { BrandLockup, Logo } from "@/components/brand";
import { crossPath } from "@/components/page-motif";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

/** The logo's cross; every ring is this one outline at a different scale. */
const RING_WIDTH = 100;
const RING = crossPath(0, 0, RING_WIDTH, 20, 16, 7);

/**
 * Where a ring rests, as its width in a 1400 × 1400 box drawn at 56rem. The first stop is on
 * the logo's edge and the last is past the still design; a ring is invisible at both.
 */
const RING_STOPS = [
  { width: 240, opacity: 0 },
  { width: 360, opacity: 0.24 },
  { width: 480, opacity: 0.21 },
  { width: 600, opacity: 0.18 },
  { width: 720, opacity: 0.15 },
  { width: 840, opacity: 0.12 },
  { width: 960, opacity: 0.09 },
  { width: 1080, opacity: 0 },
];

/** Each ring rests at one stop and, when in motion, drifts to the next. */
const RINGS = RING_STOPS.slice(0, -1).map((stop, index) => ({
  rest: stop,
  next: RING_STOPS[index + 1],
}));

export default function LoginPage() {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <main className="flex flex-col px-6 py-6 sm:px-10 sm:py-8">
        <BrandLockup size="md" />

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-12">
          <div className="flex flex-col gap-2">
            <h1 className="text-[2rem] leading-tight font-semibold tracking-tight">
              Sign in
            </h1>
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
          <svg viewBox="-700 -700 1400 1400" className="size-full" focusable="false">
            {RINGS.map(({ rest, next }) => (
              <path
                key={rest.width}
                d={RING}
                fill="none"
                stroke="currentColor"
                // A non-scaling stroke is measured on screen: 2 of the box's 1400 units at 56rem.
                strokeWidth="0.08rem"
                vectorEffect="non-scaling-stroke"
                className="motion-safe:ring-wave"
                style={
                  {
                    transform: `scale(${rest.width / RING_WIDTH})`,
                    opacity: rest.opacity,
                    "--ring-wave-scale": next.width / RING_WIDTH,
                    "--ring-wave-opacity": next.opacity,
                  } as CSSProperties
                }
              />
            ))}
          </svg>
          {/* Lazy, so phones, where this panel is hidden, never download it. */}
          <Logo
            size={160}
            loading="lazy"
            className="opacity-70 absolute inset-0 m-auto"
          />
        </div>

        <div className="flex max-w-lg flex-col gap-4">
          <p className="font-heading text-[2.625rem] leading-[1.1] font-medium tracking-tight text-balance">
            Every ward, every patient, read at a glance.
          </p>
          <p className="max-w-md text-lg text-pretty text-brand-panel-foreground/80">
            Doctors, the patients in their care and how each one is doing, in
            one place.
          </p>
        </div>
      </aside>
    </div>
  );
}
