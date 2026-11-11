"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { create } from "zustand";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { roleQuery } from "./session";

/*
 * This module is in every signed-in page's bundle, so it holds only the open state, the
 * shortcut and the trigger. The palette's body (cmdk, search, actions) is a separate
 * chunk, downloaded the first time the palette opens.
 */

export type FormKind = "doctor" | "patient";

interface PaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Lives here so that text typed while the body is still downloading carries over. */
  query: string;
  setQuery: (query: string) => void;
}

/** Where focus goes back to on close. The inputs autofocus, so the dialog cannot work it out. */
let returnFocus: HTMLElement | null = null;

/** Open state lives outside React so any control, or a shortcut, can open the palette. */
export const useCommandPalette = create<PaletteState>((set, get) => ({
  open: false,
  setOpen: (open) => {
    if (open && !get().open) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    set({ open });
  },
  query: "",
  setQuery: (query) => set({ query }),
}));

export const SEARCH_PLACEHOLDER = "Search doctors, patients and actions…";
/** A fixed height, so results arriving or narrowing never resize the dialog. */
export const LIST_HEIGHT = "h-[min(25rem,calc(100dvh-9rem))]";

const loadBody = () => import("./palette-body");
const loadDoctorForm = () => import("@/features/doctors/doctor-form-dialog");
const loadPatientForm = () => import("@/features/patients/patient-form-dialog");

export const preloadForm = (kind: FormKind) =>
  void (kind === "doctor" ? loadDoctorForm() : loadPatientForm());

const PaletteBody = dynamic(() => loadBody().then((mod) => mod.PaletteBody), {
  ssr: false,
  loading: () => <BodyFallback />,
});
const DoctorFormDialog = dynamic(() => loadDoctorForm().then((mod) => mod.DoctorFormDialog), {
  ssr: false,
});
const PatientFormDialog = dynamic(() => loadPatientForm().then((mod) => mod.PatientFormDialog), {
  ssr: false,
});

function isApplePlatform() {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform || nav.platform);
}

function isPaletteShortcut(event: KeyboardEvent, apple: boolean) {
  if (event.repeat || event.isComposing || event.altKey || event.shiftKey) return false;
  // `code` covers non-Latin layouts, where `key` is not a Latin letter at all.
  const latin = /^[a-z]$/i.test(event.key);
  if (latin ? event.key.toLowerCase() !== "k" : event.code !== "KeyK") return false;
  return apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
}

const anotherDialogIsOpen = () =>
  document.querySelector('[role="dialog"][data-open], [role="alertdialog"][data-open]') !== null;

function usePaletteShortcut() {
  useEffect(() => {
    const apple = isApplePlatform();
    function onKeyDown(event: KeyboardEvent) {
      if (!isPaletteShortcut(event, apple)) return;
      const { open, setOpen } = useCommandPalette.getState();
      // Opening over a form would put unsaved input one keystroke away from being lost.
      if (!open && anotherDialogIsOpen()) return;
      event.preventDefault();
      setOpen(!open);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

const noSubscription = () => () => {};

/** Null on the server and during hydration: the prerendered shell cannot know the platform. */
function useShortcutLabel() {
  return useSyncExternalStore(
    noSubscription,
    () => (isApplePlatform() ? "⌘K" : "Ctrl K"),
    () => null,
  );
}

/** Mounted once in the signed-in layout. */
export function CommandPalette() {
  const queryClient = useQueryClient();
  const open = useCommandPalette((state) => state.open);
  const setOpen = useCommandPalette((state) => state.setOpen);
  const setQuery = useCommandPalette((state) => state.setQuery);
  const [form, setForm] = useState<{ kind: FormKind; open: boolean } | null>(null);
  // A form opens only once the palette has finished closing, so each dialog hands
  // focus back to the element that had it before the palette opened.
  const pendingForm = useRef<FormKind | null>(null);

  usePaletteShortcut();

  useEffect(() => {
    // Starts the role lookup alongside the body's download rather than after it.
    if (open) void queryClient.prefetchQuery(roleQuery);
  }, [open, queryClient]);

  function openForm(kind: FormKind) {
    pendingForm.current = kind;
    setOpen(false);
  }

  function onOpenChangeComplete(isOpen: boolean) {
    if (isOpen) return;
    setQuery("");
    const kind = pendingForm.current;
    pendingForm.current = null;
    if (kind) setForm({ kind, open: true });
  }

  const formProps = (kind: FormKind) => ({
    open: form?.kind === kind && form.open,
    onOpenChange: (next: boolean) => setForm({ kind, open: next }),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen} onOpenChangeComplete={onOpenChangeComplete}>
        <DialogContent
          showCloseButton={false}
          finalFocus={() => (returnFocus?.isConnected ? returnFocus : true)}
          className="top-3 max-w-[calc(100%-1.5rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:top-[12dvh] sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Find doctors and patients, go to a page, or run an action.
          </DialogDescription>
          <PaletteBody onOpenForm={openForm} />
        </DialogContent>
      </Dialog>
      {form?.kind === "doctor" && <DoctorFormDialog {...formProps("doctor")} />}
      {form?.kind === "patient" && <PatientFormDialog {...formProps("patient")} />}
    </>
  );
}

/** Same frame as the body's input, so the swap is invisible and early typing is kept. */
function BodyFallback() {
  const query = useCommandPalette((state) => state.query);
  const setQuery = useCommandPalette((state) => state.setQuery);

  return (
    <div className="flex flex-col p-1">
      <div className="p-1 pb-0">
        <InputGroup className="h-9 bg-input/50">
          <input
            autoFocus
            aria-label="Search"
            placeholder={SEARCH_PLACEHOLDER}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full text-sm outline-hidden"
          />
          <InputGroupAddon>
            <SearchIcon className="size-4 shrink-0 opacity-50" />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className={LIST_HEIGHT} />
    </div>
  );
}

/** The sidebar's entry point to the palette. */
export function SearchTrigger({ className }: { className?: string }) {
  const setOpen = useCommandPalette((state) => state.setOpen);
  const shortcut = useShortcutLabel();

  return (
    <SidebarMenuButton
      className={className}
      tooltip={{
        children: (
          <>
            Search
            {shortcut && <Kbd>{shortcut}</Kbd>}
          </>
        ),
      }}
      aria-haspopup="dialog"
      aria-keyshortcuts={shortcut ? (shortcut === "⌘K" ? "Meta+K" : "Control+K") : undefined}
      onClick={() => setOpen(true)}
      // Pointing at or tabbing to the trigger is a strong hint; fetch the body early.
      onPointerEnter={() => void loadBody()}
      onFocus={() => void loadBody()}
    >
      <SearchIcon />
      <span>Search</span>
      {shortcut && (
        <Kbd className="ml-auto animate-in fade-in-0 group-data-[collapsible=icon]:hidden pointer-coarse:hidden">
          {shortcut}
        </Kbd>
      )}
    </SidebarMenuButton>
  );
}
