"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * Phones only; desktop has no top bar. The right side is left clear for the page's
 * primary action, which `PageHeader` pins there below `md`.
 */
export function MobileTopBar() {
  const { toggleSidebar } = useSidebar();

  return (
    // The two pseudo-elements round the page's top corners; content scrolls beneath them.
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 bg-sidebar px-4 md:hidden",
        "before:pointer-events-none before:absolute before:top-full before:left-0 before:size-5 before:bg-[radial-gradient(circle_at_100%_100%,transparent_19.5px,var(--sidebar)_20px)]",
        "after:pointer-events-none after:absolute after:top-full after:right-0 after:size-5 after:bg-[radial-gradient(circle_at_0%_100%,transparent_19.5px,var(--sidebar)_20px)]",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        onClick={toggleSidebar}
        className="-ml-2 hover:bg-sidebar-accent dark:hover:bg-sidebar-accent"
      >
        <MenuIcon className="size-5" />
      </Button>
      {/* Gives way to the pinned action when both would not fit. */}
      <Link
        href="/dashboard"
        aria-label="Doctor Tracker, go to the dashboard"
        className="flex min-w-0 rounded-lg ring-ring outline-none focus-visible:ring-2 max-[359px]:group-has-[[data-primary-action]_button]/sidebar-wrapper:hidden"
      >
        <BrandLockup size="sm" />
      </Link>
    </header>
  );
}
