import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createLoader } from "nuqs/server";
import { PageHeader } from "@/components/page-header";
import { DashboardSkeleton, DashboardView } from "@/features/dashboard/dashboard-view";
import { analyticsQueries, mixParam, rangeParam } from "@/features/dashboard/queries";
import { getQueryClient } from "@/lib/query-client";
import { apiContext } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const loadParams = createLoader({ range: rangeParam, mix: mixParam });

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <>
      <PageHeader
        motif="dashboard"
        title="Dashboard"
        description="Patient load and new registrations across every doctor."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DashboardData({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  // Live data: render on every request, never as part of a prefetched shell.
  await connection();
  const [{ range, mix }, context] = await Promise.all([loadParams(searchParams), apiContext()]);
  const queryClient = getQueryClient();

  // All in parallel. Registrations and arrival hours are left to the browser, because
  // they are grouped in the visitor's time zone.
  await Promise.all([
    queryClient.prefetchQuery(analyticsQueries.summary("30d", context)),
    queryClient.prefetchQuery(analyticsQueries.summary(range, context)),
    queryClient.prefetchQuery(analyticsQueries.conditions(context)),
    queryClient.prefetchQuery(analyticsQueries.topDoctors(context)),
    queryClient.prefetchQuery(analyticsQueries.workload(context)),
    queryClient.prefetchQuery(analyticsQueries.criticalDoctors(context)),
    // The specialization grouping also counts specializations for the overview.
    queryClient.prefetchQuery(analyticsQueries.conditionMix("specialization", context)),
    mix === "specialization"
      ? undefined
      : queryClient.prefetchQuery(analyticsQueries.conditionMix(mix, context)),
    queryClient.prefetchQuery(analyticsQueries.demographics(context)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView />
    </HydrationBoundary>
  );
}
