import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AddDoctorButton } from "@/features/doctors/doctor-actions";
import { DoctorsView } from "@/features/doctors/doctors-view";
import { loadDoctorParams, toDoctorQuery } from "@/features/doctors/params";
import { doctorQueries } from "@/features/doctors/queries";
import { hasDateRange } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { apiContext } from "@/lib/session";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage({ searchParams }: PageProps<"/doctors">) {
  return (
    <>
      <PageHeader title="Doctors" description="Everyone on the roster, and how many patients each one has.">
        <Suspense>
          <AddDoctorButton />
        </Suspense>
      </PageHeader>

      {/* The header above is static; only this part waits for the request. */}
      <Suspense fallback={<DoctorsFallback />}>
        <DoctorsData searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DoctorsData({ searchParams }: Pick<PageProps<"/doctors">, "searchParams">) {
  // Live data: render on every request, never as part of a prefetched shell.
  await connection();
  const [params, context] = await Promise.all([loadDoctorParams(searchParams), apiContext()]);
  const queryClient = getQueryClient();

  // Awaited inside the Suspense boundary: the page shell is already on screen, and the
  // table arrives as finished HTML with its data, so the browser never refetches it.
  await Promise.all([
    queryClient.prefetchQuery(doctorQueries.filters(context)),
    // Date filters depend on the visitor's time zone, which the server can't know;
    // the browser fetches those pages itself.
    hasDateRange(params)
      ? undefined
      : queryClient.prefetchQuery(doctorQueries.list(toDoctorQuery(params), context)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DoctorsView />
    </HydrationBoundary>
  );
}

function DoctorsFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-full rounded-full sm:w-72" />
        <Skeleton className="h-9 w-44 rounded-full" />
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <DataTableSkeleton />
      </div>
    </div>
  );
}
