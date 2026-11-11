import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageMotif } from "@/components/page-motif";
import { UserProvider } from "@/components/user-provider";
import { DoctorProfile, DoctorProfileSkeleton } from "@/features/doctors/doctor-profile";
import { doctorQueries } from "@/features/doctors/queries";
import { loadPatientParams, toPatientQuery } from "@/features/patients/params";
import { patientQueries } from "@/features/patients/queries";
import { ApiError } from "@/lib/api";
import { hasDateRange } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { apiContext, getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Doctor profile" };

export default function DoctorPage(props: PageProps<"/doctors/[id]">) {
  return (
    <>
      <PageMotif name="profile" />
      <Suspense fallback={<DoctorProfileSkeleton />}>
        <DoctorData {...props} />
      </Suspense>
    </>
  );
}

async function DoctorData({ params, searchParams }: PageProps<"/doctors/[id]">) {
  // Live data: render on every request, never as part of a prefetched shell.
  await connection();
  const [{ id }, listParams, context, user] = await Promise.all([
    params,
    loadPatientParams(searchParams),
    apiContext(),
    getCurrentUser(),
  ]);
  const queryClient = getQueryClient();
  const detail = doctorQueries.detail(id, context);

  await Promise.all([
    queryClient.prefetchQuery(detail),
    hasDateRange(listParams)
      ? undefined
      : queryClient.prefetchQuery(
          patientQueries.list(toPatientQuery({ ...listParams, doctorId: id }), context),
        ),
  ]);

  // A missing doctor, or an id that isn't one, gets the not-found page.
  const failure = queryClient.getQueryState(detail.queryKey)?.error;
  if (failure instanceof ApiError && (failure.status === 404 || failure.status === 400)) notFound();

  return (
    <UserProvider user={user}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DoctorProfile id={id} />
      </HydrationBoundary>
    </UserProvider>
  );
}
