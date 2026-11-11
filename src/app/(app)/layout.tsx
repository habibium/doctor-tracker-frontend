import { type ReactNode, Suspense } from "react";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { SiteHeader } from "@/components/app-shell/site-header";
import { UserMenuSkeleton } from "@/components/app-shell/user-menu";
import { CurrentUserMenu } from "@/components/current-user";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CommandPalette } from "@/features/search/command-palette";

/**
 * The sidebar and header contain nothing request-specific, so they are prerendered
 * and appear at once. Only the user menu waits for the session lookup.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar
        footer={
          <Suspense fallback={<UserMenuSkeleton />}>
            <CurrentUserMenu />
          </Suspense>
        }
      />
      <SidebarInset>
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
