"use client";

import { type ReactNode, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  StethoscopeIcon,
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchTrigger } from "@/features/search/command-palette";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/doctors", label: "Doctors", icon: StethoscopeIcon },
  { href: "/patients", label: "Patients", icon: UsersRoundIcon },
];

function NavLinks({ pathname }: { pathname: string | null }) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            render={<Link href={href} />}
            isActive={pathname === href || pathname?.startsWith(`${href}/`)}
            tooltip={label}
            onClick={() => setOpenMobile(false)}
            className="data-active:bg-background data-active:text-foreground data-active:shadow-xs data-active:[&_svg]:text-primary"
          >
            <Icon />
            <span>{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function BrandLink() {
  const { setOpenMobile } = useSidebar();

  return (
    <Link
      href="/dashboard"
      aria-label="Doctor Tracker, go to the dashboard"
      onClick={() => setOpenMobile(false)}
      className="flex h-12 items-center gap-2.5 rounded-xl px-2 ring-sidebar-ring outline-none focus-visible:ring-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
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
    <div className="flex items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-0">
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

/** `footer` is rendered by the server, so the sidebar itself needs no session data. */
export function AppSidebar({ footer }: { footer: ReactNode }) {
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
            <Suspense fallback={<NavLinks pathname={null} />}>
              <ActiveNavLinks />
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
