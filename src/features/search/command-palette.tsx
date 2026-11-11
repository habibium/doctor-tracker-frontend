"use client";

import { SearchIcon } from "lucide-react";
import { create } from "zustand";
import { Kbd } from "@/components/ui/kbd";
import { SidebarMenuButton } from "@/components/ui/sidebar";

/** Open state lives outside React so any control, or a shortcut, can open the palette. */
export const useCommandPalette = create<{ open: boolean; setOpen: (open: boolean) => void }>(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
  }),
);

/** Mounted once in the signed-in layout. */
export function CommandPalette() {
  return null;
}

/** The sidebar's entry point to the palette. */
export function SearchTrigger() {
  const setOpen = useCommandPalette((state) => state.setOpen);

  return (
    <SidebarMenuButton tooltip="Search" onClick={() => setOpen(true)}>
      <SearchIcon />
      <span>Search</span>
      <Kbd className="ml-auto group-data-[collapsible=icon]:hidden">⌘K</Kbd>
    </SidebarMenuButton>
  );
}
