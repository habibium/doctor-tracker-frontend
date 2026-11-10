import { type ReactNode, Suspense } from "react";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { SiteHeader } from "@/components/app-shell/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserProvider } from "@/components/user-provider";
import { getCurrentUser } from "@/lib/session";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    // The session read depends on the request, so it has to sit under a boundary.
    <Suspense>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  // Not awaited: the shell renders straight away and only the parts that show the
  // user wait for the lookup. An invalid session redirects to /login.
  const userPromise = getCurrentUser();

  return (
    <UserProvider userPromise={userPromise}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
