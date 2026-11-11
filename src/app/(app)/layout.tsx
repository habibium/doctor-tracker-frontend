import { type ReactNode, Suspense } from "react";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { MobileTopBar } from "@/components/app-shell/site-header";
import { UserMenuSkeleton } from "@/components/app-shell/user-menu";
import { CurrentUserMenu } from "@/components/current-user";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CommandPalette } from "@/features/search/command-palette";

/**
 * The sidebar sits on a tinted plane and the page is one rounded panel that scrolls on
 * its own. Nothing here is request-specific, so it is prerendered; only the user menu
 * waits for the session lookup.
 *
 * Below `md` the document scrolls instead, and the panel is the page background itself:
 * no ancestor of the content may form a stacking context there, or the primary action
 * pinned into the top bar would be painted underneath it.
 *
 * A page that renders `data-fill-page` (the lists) is held to the panel's height instead
 * of growing past it, so its table scrolls and the panel does not.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="md:h-svh md:overflow-hidden md:brand-plane md:**:data-[slot=sidebar-inner]:bg-transparent">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <AppSidebar
        footer={
          <Suspense fallback={<UserMenuSkeleton />}>
            <CurrentUserMenu />
          </Suspense>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <MobileTopBar />
        <main
          id="main"
          tabIndex={-1}
          className="flex flex-1 flex-col outline-none md:min-h-0 md:panel-scroll md:rounded-2xl md:border md:bg-background md:shadow-panel"
        >
          {/* Anchors each page's header artwork to the panel's full width. */}
          <div className="relative flex flex-1 flex-col md:isolate md:has-[[data-fill-page]]:min-h-0">
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-5 pb-12 sm:px-6 md:px-8 md:pt-8 md:has-[[data-fill-page]]:min-h-0 md:has-[[data-fill-page]]:pb-8 lg:px-10">
              {children}
            </div>
          </div>
        </main>
      </div>
      <CommandPalette />
    </SidebarProvider>
  );
}
