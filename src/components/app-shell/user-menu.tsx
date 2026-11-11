"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { initials } from "@/lib/format";
import type { CurrentUser } from "@/lib/session";

const ROLE_LABELS = { admin: "Admin", viewer: "Viewer, read only" };

export function UserMenu({ user }: { user: CurrentUser }) {
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    queryClient.clear();
    // A full page load, so nothing cached for this user survives in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={user.name}
                className="data-popup-open:bg-sidebar-accent"
              />
            }
          >
            <Avatar>
              <AvatarFallback className="bg-primary/12 font-medium text-primary dark:bg-primary/18">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="grid flex-1 text-left leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </span>
            </span>
            <ChevronsUpDownIcon className="ml-auto text-sidebar-foreground/60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                {user.email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled={signingOut} onClick={signOut}>
                <LogOutIcon />
                {signingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** Fixed sizes on purpose: this is part of the prerendered shell, so it must be stable. */
export function UserMenuSkeleton() {
  return (
    <div className="flex h-14 items-center gap-2 px-3" role="status" aria-label="Loading account">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  );
}
