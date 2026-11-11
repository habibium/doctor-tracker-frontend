import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ListFallback } from "@/components/data-table/list-fallback";
import { AdminOnly } from "@/components/current-user";
import { PageHeader } from "@/components/page-header";
import { UserProvider } from "@/components/user-provider";
import { loadUserParams, toUserQuery } from "@/features/users/params";
import { userQueries } from "@/features/users/queries";
import { AddUserButton } from "@/features/users/user-actions";
import { UsersView } from "@/features/users/users-view";
import { hasDateRange } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { apiContext, getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage({ searchParams }: PageProps<"/users">) {
  return (
    <>
      <PageHeader
        motif="profile"
        title="Users"
        description="Who can sign in, and what each person can do."
        primaryAction={
          <Suspense>
            <AdminOnly>
              <AddUserButton />
            </AdminOnly>
          </Suspense>
        }
      />

      {/* The header above is static; only this part waits for the request. */}
      <Suspense fallback={<ListFallback />}>
        <UsersData searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UsersData({ searchParams }: Pick<PageProps<"/users">, "searchParams">) {
  // Live data: render on every request, never as part of a prefetched shell.
  await connection();
  const [params, context, user] = await Promise.all([
    loadUserParams(searchParams),
    apiContext(),
    getCurrentUser(),
  ]);
  // Viewers get the same page as a missing record. The API refuses them the data anyway.
  if (user.role !== "admin") notFound();

  const queryClient = getQueryClient();
  // Date filters depend on the visitor's time zone, which the server can't know.
  if (!hasDateRange(params)) {
    await queryClient.prefetchQuery(userQueries.list(toUserQuery(params), context));
  }

  return (
    <UserProvider user={user}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersView />
      </HydrationBoundary>
    </UserProvider>
  );
}
