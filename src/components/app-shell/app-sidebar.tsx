"use client";

import { type ReactNode, Suspense, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboardIcon,
  type LucideIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  StethoscopeIcon,
  UserCogIcon,
  UsersRoundIcon,
} from "lucide-react";
import { Logo, Wordmark } from "@/components/brand";
import { ThemeSwitch, ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { analyticsQueries } from "@/features/dashboard/queries";
import { SearchTrigger } from "@/features/search/command-palette";
import type { AnalyticsSummary } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: keyof Pick<AnalyticsSummary, "totalDoctors" | "totalPatients">;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/doctors", label: "Doctors", icon: StethoscopeIcon, count: "totalDoctors" },
  { href: "/patients", label: "Patients", icon: UsersRoundIcon, count: "totalPatients" },
];

// The dashboard's own key would race its server data: once the shell has created that query,
// the page's prefetched copy no longer hydrates in render. Analytics invalidation still covers it.
const navCountsQuery = {
  ...analyticsQueries.summary("30d"),
  queryKey: [...queryKeys.analytics, "nav-counts"],
};

const noSubscription = () => () => {};

/** Nothing on the server or during hydration: the prerendered shell has no counts to match. */
function useNavCounts() {
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  const { data } = useQuery(navCountsQuery);
  return hydrated ? data : undefined;
}

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
  total,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  pathname: string | null;
  total?: string | null;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} />}
        isActive={pathname === href || pathname?.startsWith(`${href}/`)}
        tooltip={label}
        aria-label={total ? `${label}, ${total}` : undefined}
        onClick={() => setOpenMobile(false)}
        className="data-active:bg-background data-active:text-foreground data-active:shadow-xs data-active:[&_svg]:text-brand-mint"
      >
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
      {total && (
        <SidebarMenuBadge
          aria-hidden="true"
          className="right-2 font-normal text-muted-foreground peer-hover/menu-button:text-muted-foreground peer-data-active/menu-button:text-muted-foreground peer-data-[size=default]/menu-button:top-2"
        >
          {total}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

function NavLinks({ pathname, children }: { pathname: string | null; children?: ReactNode }) {
  const counts = useNavCounts();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map(({ href, label, icon, count }) => (
        <NavItem
          key={href}
          href={href}
          label={label}
          icon={icon}
          pathname={pathname}
          total={count && counts ? formatNumber(counts[count]) : null}
        />
      ))}
      {children}
    </SidebarMenu>
  );
}

function ActiveNavLinks({ children }: { children?: ReactNode }) {
  return <NavLinks pathname={usePathname()}>{children}</NavLinks>;
}

/**
 * Links only admins get. The layout renders this inside `AdminOnly`, so it streams in with
 * the session after the static shell, below the other links, where it moves nothing.
 */
export function AdminNavLinks() {
  return <NavItem href="/users" label="Users" icon={UserCogIcon} pathname={usePathname()} />;
}

function BrandLink() {
  const { setOpenMobile } = useSidebar();

  return (
    <Link
      href="/dashboard"
      aria-label="Doctor Tracker, go to the dashboard"
      onClick={() => setOpenMobile(false)}
      className="flex h-12 items-center gap-2.5 rounded-xl px-2.5 ring-sidebar-ring outline-none focus-visible:ring-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
    >
      <Logo size={32} />
      <Wordmark className="text-[1.1875rem] group-data-[collapsible=icon]:hidden" />
    </Link>
  );
}

/** Theme and collapse sit together above the account menu, in both sidebar widths. */
function SidebarControls() {
  const { toggleSidebar, isMobile, state } = useSidebar();
  const label = isMobile ? "Close menu" : state === "expanded" ? "Collapse sidebar" : "Expand sidebar";

  return (
    <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col">
      <ThemeSwitch className="group-data-[collapsible=icon]:hidden" />
      <ThemeToggle side="right" align="end" className="hidden group-data-[collapsible=icon]:flex" />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              onClick={toggleSidebar}
              className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground dark:hover:bg-sidebar-accent"
            />
          }
        >
          <PanelLeftCloseIcon className="group-data-[collapsible=icon]:hidden" />
          <PanelLeftOpenIcon className="hidden group-data-[collapsible=icon]:block" />
        </TooltipTrigger>
        <TooltipContent side={state === "expanded" ? "top" : "right"} hidden={isMobile}>
          {label}
          <Kbd>⌘B</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/** `adminLinks` and `footer` are rendered by the server, so the sidebar needs no session data. */
export function AppSidebar({ adminLinks, footer }: { adminLinks: ReactNode; footer: ReactNode }) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="pb-0">
        <BrandLink />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SearchTrigger />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="pt-1">
          <SidebarGroupContent>
            {/* The path is unknown while the shell prerenders, so links start unhighlighted. */}
            <Suspense fallback={<NavLinks pathname={null}>{adminLinks}</NavLinks>}>
              <ActiveNavLinks>{adminLinks}</ActiveNavLinks>
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3">
        <SidebarControls />
        {footer}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
