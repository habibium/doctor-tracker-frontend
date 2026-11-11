"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { create } from "zustand";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import type { PatientDoctor } from "@/lib/api";
import { cn } from "@/lib/utils";
import { roleQuery } from "./session";

// In every signed-in page's bundle, so only the frame, shortcut and trigger live here;
// the body (cmdk, search, actions) is a separate chunk fetched on first open.

export type FormKind = "doctor" | "patient";

/** `doctor` fixes the doctor of a new patient, as on that doctor's page. */
export interface FormRequest {
  kind: FormKind;
  doctor?: PatientDoctor;
}

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
      const active = document.activeElement;
      returnFocus = active instanceof HTMLElement && active !== document.body ? active : null;
    }
    set({ open });
  },
  query: "",
  setQuery: (query) => set({ query }),
}));

const OFFLINE_HINT = "Check your connection, then try again.";

export const SEARCH_PLACEHOLDER = "Search doctors, patients and actions…";
/** A fixed height, so results arriving or narrowing never resize the dialog. */
export const LIST_HEIGHT = "h-[min(25rem,calc(100dvh-9rem))]";

type Body = typeof import("./palette-body").PaletteBody;
let bodyPromise: Promise<Body> | null = null;

/** Loaded by hand rather than with `lazy`, which would keep a failed download failed. */
function loadBody() {
  bodyPromise ??= import("./palette-body").then(
    (mod) => mod.PaletteBody,
    (error: unknown) => {
      bodyPromise = null;
      throw error;
    },
  );
  return bodyPromise;
}

/** A failure here is retried, and reported, when the palette actually opens. */
const preloadBody = () => void loadBody().catch(() => {});

const loadDoctorForm = () => import("@/features/doctors/doctor-form-dialog");
const loadPatientForm = () => import("@/features/patients/patient-form-dialog");

export const preloadForm = (kind: FormKind) =>
  void (kind === "doctor" ? loadDoctorForm() : loadPatientForm()).catch(() => {});

interface FormDialogs {
  doctor?: typeof import("@/features/doctors/doctor-form-dialog").DoctorFormDialog;
  patient?: typeof import("@/features/patients/patient-form-dialog").PatientFormDialog;
}

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
  const [Body, setBody] = useState<Body | null>(null);
  const [bodyFailed, setBodyFailed] = useState(false);
  const [forms, setForms] = useState<FormDialogs>({});
  const [form, setForm] = useState<(FormRequest & { open: boolean }) | null>(null);
  // A form opens only once the palette has finished closing, so each dialog hands
  // focus back to the element that had it before the palette opened.
  const pendingForm = useRef<FormRequest | null>(null);

  usePaletteShortcut();

  useEffect(() => {
    if (!open) return;
    // Starts the role lookup alongside the body's download rather than after it.
    void queryClient.prefetchQuery(roleQuery);
    if (!Body) {
      loadBody().then(
        (component) => setBody(() => component),
        () => setBodyFailed(true),
      );
    }
  }, [open, Body, queryClient]);

  function openForm(request: FormRequest) {
    pendingForm.current = request;
    setOpen(false);
  }

  function onOpenChangeComplete(isOpen: boolean) {
    if (isOpen) return;
    setQuery("");
    setBodyFailed(false);
    const request = pendingForm.current;
    pendingForm.current = null;
    if (!request) return;
    // Loaded by hand, like the body, so a failed download is reported rather than thrown.
    const loaded: Promise<FormDialogs> =
      request.kind === "doctor"
        ? loadDoctorForm().then((mod) => ({ doctor: mod.DoctorFormDialog }))
        : loadPatientForm().then((mod) => ({ patient: mod.PatientFormDialog }));
    loaded.then(
      (dialog) => {
        setForms((current) => ({ ...current, ...dialog }));
        setForm({ ...request, open: true });
      },
      () => toast.add({ type: "error", title: "The form could not load", description: OFFLINE_HINT }),
    );
  }

  const onFormOpenChange = (next: boolean) => setForm((current) => current && { ...current, open: next });
  const { doctor: DoctorFormDialog, patient: PatientFormDialog } = forms;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen} onOpenChangeComplete={onOpenChangeComplete}>
        <DialogContent
          showCloseButton={false}
          // With nothing focused before, the dialog's default would focus the first link.
          finalFocus={() => (returnFocus?.isConnected ? returnFocus : false)}
          className="top-3 max-w-[calc(100%-1.5rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:top-[12dvh] sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Find doctors and patients, go to a page, or run an action.
          </DialogDescription>
          {Body ? <Body onOpenForm={openForm} /> : <BodyFallback failed={bodyFailed} />}
          <KeyboardHints />
        </DialogContent>
      </Dialog>
      {form?.kind === "doctor" && DoctorFormDialog && (
        <DoctorFormDialog open={form.open} onOpenChange={onFormOpenChange} />
      )}
      {form?.kind === "patient" && PatientFormDialog && (
        <PatientFormDialog doctor={form.doctor} open={form.open} onOpenChange={onFormOpenChange} />
      )}
    </>
  );
}

/** Looks like the body's input, without its code, so the swap is invisible and early typing is kept. */
function BodyFallback({ failed }: { failed: boolean }) {
  const query = useCommandPalette((state) => state.query);
  const setQuery = useCommandPalette((state) => state.setQuery);

  return (
    <div className="flex flex-col p-1">
      <div className="p-1 pb-0">
        <div className="flex h-9 items-center rounded-4xl border border-transparent bg-input/50">
          <SearchIcon className="ml-3 size-4 shrink-0 text-muted-foreground opacity-50" />
          <input
            autoFocus
            aria-label="Search"
            placeholder={SEARCH_PLACEHOLDER}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full pl-1.5 text-sm outline-hidden"
          />
        </div>
      </div>
      <div className={cn(LIST_HEIGHT, "flex items-center justify-center px-6 text-center")}>
        {failed && (
          <p role="alert" className="text-sm text-muted-foreground">
            Search could not load. {OFFLINE_HINT}
          </p>
        )}
      </div>
    </div>
  );
}

/** Outside the body, so the frame keeps its height when the body replaces the fallback. */
function KeyboardHints() {
  return (
    <>
      <Separator className="pointer-coarse:hidden" />
      <div className="flex items-center gap-4 px-4 py-2.5 text-xs text-muted-foreground pointer-coarse:hidden">
        <span className="flex items-center gap-1.5">
          <KbdGroup>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
          </KbdGroup>
          to move
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          to open
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>Esc</Kbd>
          to close
        </span>
      </div>
    </>
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
      onPointerEnter={preloadBody}
      onFocus={preloadBody}
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
