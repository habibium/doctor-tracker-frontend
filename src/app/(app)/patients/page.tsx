import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ListFallback } from "@/components/data-table/list-fallback";
import { AdminOnly } from "@/components/current-user";
import { PageHeader } from "@/components/page-header";
import { UserProvider } from "@/components/user-provider";
import { loadPatientParams, toPatientQuery } from "@/features/patients/params";
import { AddPatientButton } from "@/features/patients/patient-actions";
import { PatientsView } from "@/features/patients/patients-view";
import { patientQueries } from "@/features/patients/queries";
import { hasDateRange } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { apiContext, getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage({ searchParams }: PageProps<"/patients">) {
  return (
    <>
      <PageHeader
        motif="patients"
        title="Patients"
        description="Every patient on record, with their condition and doctor."
        primaryAction={
          <Suspense>
            <AdminOnly>
              <AddPatientButton />
            </AdminOnly>
          </Suspense>
        }
      />

      <Suspense fallback={<ListFallback />}>
        <PatientsData searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PatientsData({ searchParams }: Pick<PageProps<"/patients">, "searchParams">) {
  // Live data: render on every request, never as part of a prefetched shell.
  await connection();
  const [params, context, user] = await Promise.all([
    loadPatientParams(searchParams),
    apiContext(),
    getCurrentUser(),
  ]);
  const queryClient = getQueryClient();

  // Date filters depend on the visitor's time zone, which the server can't know;
  // the browser fetches those pages itself.
  if (!hasDateRange(params)) {
    await queryClient.prefetchQuery(patientQueries.list(toPatientQuery(params), context));
  }

  return (
    <UserProvider user={user}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PatientsView />
      </HydrationBoundary>
    </UserProvider>
  );
}
