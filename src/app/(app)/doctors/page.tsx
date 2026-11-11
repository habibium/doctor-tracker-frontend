import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ListFallback } from "@/components/data-table/list-fallback";
import { AdminOnly } from "@/components/current-user";
import { PageHeader } from "@/components/page-header";
import { UserProvider } from "@/components/user-provider";
import { AddDoctorButton } from "@/features/doctors/doctor-actions";
import { DoctorsView } from "@/features/doctors/doctors-view";
import { loadDoctorParams, toDoctorQuery } from "@/features/doctors/params";
import { doctorQueries } from "@/features/doctors/queries";
import { hasDateRange } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { apiContext, getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage({ searchParams }: PageProps<"/doctors">) {
  return (
    <>
      <PageHeader
        motif="doctors"
        title="Doctors"
        description="Everyone on the roster, and how many patients each one has."
        primaryAction={
          <Suspense>
            <AdminOnly>
              <AddDoctorButton />
            </AdminOnly>
          </Suspense>
        }
      />

      {/* The header above is static; only this part waits for the request. */}
      <Suspense fallback={<ListFallback />}>
        <DoctorsData searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DoctorsData({ searchParams }: Pick<PageProps<"/doctors">, "searchParams">) {
  // Live data: render on every request, never as part of a prefetched shell.
  await connection();
  const [params, context, user] = await Promise.all([
    loadDoctorParams(searchParams),
    apiContext(),
    getCurrentUser(),
  ]);
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
    <UserProvider user={user}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DoctorsView />
      </HydrationBoundary>
    </UserProvider>
  );
}
