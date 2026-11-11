"use client";

import { type ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  type LucideIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  RotateCcwIcon,
  Rows3Icon,
  Rows4Icon,
  StethoscopeIcon,
  SunIcon,
  UserRoundPlusIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogClose } from "@/components/ui/dialog";
import { InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { useSidebar } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { doctorQueries } from "@/features/doctors/queries";
import { ConditionBadge } from "@/features/patients/conditions";
import type { Doctor, Patient } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { formatNumber, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type Density, type Theme, usePreferences } from "@/stores/preferences";
import {
  type FormRequest,
  LIST_HEIGHT,
  preloadForm,
  SEARCH_PLACEHOLDER,
  useCommandPalette,
} from "./command-palette";
import { Highlight } from "./highlight";
import { matchesAll, searchTerms, tokenize } from "./match";
import { roleQuery } from "./session";
import { type GroupResult, MIN_SEARCH_LENGTH, usePaletteSearch } from "./use-palette-search";

interface PaletteCommand {
  value: string;
  label: string;
  /** Other words people may type for this command. */
  keywords: string;
  icon: LucideIcon;
  checked?: boolean;
  run: () => void;
}

const PAGES = [
  { href: "/dashboard", label: "Dashboard", keywords: "home overview analytics stats charts", icon: LayoutDashboardIcon },
  { href: "/doctors", label: "Doctors", keywords: "physicians staff list", icon: StethoscopeIcon },
  { href: "/patients", label: "Patients", keywords: "people list", icon: UsersRoundIcon },
];

const THEMES: { value: Theme; label: string; keywords: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light theme", keywords: "day bright", icon: SunIcon },
  { value: "dark", label: "Dark theme", keywords: "night", icon: MoonIcon },
  { value: "system", label: "System theme", keywords: "auto device os match", icon: MonitorIcon },
];

const DENSITIES: { value: Density; label: string; keywords: string; icon: LucideIcon }[] = [
  { value: "comfortable", label: "Comfortable rows", keywords: "relaxed roomy", icon: Rows3Icon },
  { value: "compact", label: "Compact rows", keywords: "dense tight", icon: Rows4Icon },
];

const plural = (count: number, noun: string, nouns = `${noun}s`) =>
  `${formatNumber(count)} ${count === 1 ? noun : nouns}`;

/**
 * Patients have no page of their own. Name and phone together narrow the patients list
 * to this one person; a name alone often matches dozens.
 */
const patientHref = (patient: Patient) =>
  `/patients?search=${encodeURIComponent(`${patient.name} ${patient.phone.replace(/\D/g, "")}`.trim())}`;

/** Result rows carry their own trailing content, so the item's check mark is dropped. */
const RESULT_ITEM = "py-2 [&>svg:last-child]:hidden";

export function PaletteBody({ onOpenForm }: { onOpenForm: (request: FormRequest) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { setOpenMobile } = useSidebar();
  const query = useCommandPalette((state) => state.query);
  const setQuery = useCommandPalette((state) => state.setQuery);
  const setOpen = useCommandPalette((state) => state.setOpen);
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const density = usePreferences((state) => state.density);
  const setDensity = usePreferences((state) => state.setDensity);
  const { data: role } = useQuery(roleQuery);
  const [signingOut, setSigningOut] = useState(false);
  const [selected, setSelected] = useState("");

  // On a doctor's page its record is already cached, so the palette can offer it by name.
  const pageDoctorId = /^\/doctors\/([0-9a-f]{24})$/i.exec(pathname)?.[1];
  const pageDoctor = pageDoctorId
    ? queryClient.getQueryData(doctorQueries.detail(pageDoctorId).queryKey)
    : undefined;

  const search = usePaletteSearch(query);
  const terms = searchTerms(query);
  const matches = (label: string, keywords: string) => matchesAll(terms, tokenize(label, keywords));

  function go(href: string) {
    router.push(href);
    setOpen(false);
    setOpenMobile(false);
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    await authClient.signOut();
    queryClient.clear();
    // A full page load, so nothing cached for this user survives in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  const actions: PaletteCommand[] = [
    ...(role === "admin" && pageDoctor
      ? [
          {
            value: "add-patient-here",
            label: `Add a patient to ${pageDoctor.name}`,
            keywords: "new create admit register",
            icon: UserRoundPlusIcon,
            run: () => {
              const { id, name, specialization, hospital } = pageDoctor;
              onOpenForm({ kind: "patient", doctor: { id, name, specialization, hospital } });
            },
          },
        ]
      : []),
    ...(role === "admin"
      ? [
          {
            value: "add-doctor",
            label: "Add a doctor",
            keywords: "new create physician",
            icon: PlusIcon,
            run: () => onOpenForm({ kind: "doctor" }),
          },
          {
            value: "add-patient",
            label: "Add a patient",
            keywords: "new create admit register",
            icon: PlusIcon,
            run: () => onOpenForm({ kind: "patient" }),
          },
        ]
      : []),
    {
      value: "sign-out",
      label: signingOut ? "Signing out…" : "Sign out",
      keywords: "log logout exit leave account",
      icon: LogOutIcon,
      run: () => void signOut(),
    },
  ];

  const preferences: PaletteCommand[] = [
    ...THEMES.map((option) => ({
      value: `theme-${option.value}`,
      label: option.label,
      keywords: `appearance mode colour color ${option.keywords}`,
      icon: option.icon,
      checked: theme === option.value,
      run: () => {
        setTheme(option.value);
        setOpen(false);
      },
    })),
    ...DENSITIES.map((option) => ({
      value: `density-${option.value}`,
      label: option.label,
      keywords: `row spacing density table ${option.keywords}`,
      icon: option.icon,
      checked: density === option.value,
      run: () => {
        setDensity(option.value);
        setOpen(false);
        toast.add({ title: option.label, description: "Every table uses this spacing on this device." });
      },
    })),
  ];

  const pages = PAGES.filter((page) => matches(page.label, page.keywords));
  const shownActions = actions.filter((action) => matches(action.label, action.keywords));
  const shownPreferences = preferences.filter((option) => matches(option.label, option.keywords));
  const hasLocal = pages.length + shownActions.length + shownPreferences.length > 0;
  const { doctors, patients } = search;

  // cmdk drops the highlight when several items unmount in one render, as they do when
  // results are replaced, so the highlight is held here and falls back to the first item.
  const values = [
    ...pages.map((page) => `page-${page.href}`),
    ...shownActions.map((action) => action.value),
    ...shownPreferences.map((option) => option.value),
    ...resultValues(doctors, "doctor"),
    ...resultValues(patients, "patient"),
  ];
  const highlighted = values.includes(selected) ? selected : (values[0] ?? "");

  const remoteRows = rowCount(doctors) + rowCount(patients);
  const remoteSettled =
    doctors.status === "success" && !doctors.stale && patients.status === "success" && !patients.stale;
  const announcement = !remoteSettled
    ? ""
    : remoteRows === 0
      ? `No doctors or patients match ${search.term}`
      : `${plural(doctors.total, "doctor")} and ${plural(patients.total, "patient")} found`;

  return (
    <Command
      shouldFilter={false}
      loop
      label="Search doctors, patients, pages and actions"
      value={highlighted}
      onValueChange={(value) => {
        setSelected(value);
        if (value === "add-doctor") preloadForm("doctor");
        if (value.startsWith("add-patient")) preloadForm("patient");
      }}
    >
      <CommandInput autoFocus value={query} onValueChange={setQuery} placeholder={SEARCH_PLACEHOLDER}>
        <InputGroupAddon align="inline-end">
          {search.fetching && (
            // Fades in only if the wait is long enough to notice, so fast replies never flicker.
            <span className="flex animate-in fade-in-0 delay-150 fill-mode-both">
              <Spinner className="text-muted-foreground" />
            </span>
          )}
          <DialogClose
            render={<InputGroupButton size="icon-xs" aria-label="Close" className="pointer-fine:hidden" />}
          >
            <XIcon />
          </DialogClose>
        </InputGroupAddon>
      </CommandInput>

      <CommandList label="Results" className={cn(LIST_HEIGHT, "max-h-none")}>
        {pages.length > 0 && (
          <CommandGroup heading="Pages">
            {pages.map(({ href, label, icon: Icon }) => (
              <CommandItem key={href} value={`page-${href}`} onSelect={() => go(href)}>
                <Icon />
                <span>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroupOf heading="Actions" commands={shownActions} />
        <CommandGroupOf heading="Preferences" commands={shownPreferences} />

        <ResultGroup
          heading="Doctors"
          noun="doctor"
          result={doctors}
          onSeeAll={() => go(`/doctors?search=${encodeURIComponent(search.term)}`)}
        >
          {(doctor: Doctor) => (
            <CommandItem
              key={doctor.id}
              value={`doctor-${doctor.id}`}
              onSelect={() => go(`/doctors/${doctor.id}`)}
              className={RESULT_ITEM}
            >
              <ResultRow
                name={doctor.name}
                terms={terms}
                aside={
                  <span className="tabular text-xs font-normal text-muted-foreground">
                    {plural(doctor.patientCount, "patient")}
                  </span>
                }
              >
                <span className="truncate">
                  <Highlight text={doctor.specialization} terms={terms} />
                  {" · "}
                  <Highlight text={doctor.hospital} terms={terms} />
                </span>
              </ResultRow>
            </CommandItem>
          )}
        </ResultGroup>

        <ResultGroup
          heading="Patients"
          noun="patient"
          result={patients}
          onSeeAll={() => go(`/patients?search=${encodeURIComponent(search.term)}`)}
        >
          {(patient: Patient) => (
            <CommandItem
              key={patient.id}
              value={`patient-${patient.id}`}
              onSelect={() => go(patientHref(patient))}
              className={RESULT_ITEM}
            >
              <ResultRow
                name={patient.name}
                terms={terms}
                aside={<ConditionBadge condition={patient.condition} />}
              >
                <span className="truncate">
                  <Highlight text={patient.diagnosis} terms={terms} />
                </span>
                <span aria-hidden="true">·</span>
                <StethoscopeIcon aria-hidden="true" className="size-3" />
                <span className="truncate">
                  <span className="sr-only">Doctor: </span>
                  {patient.doctor?.name ?? "No doctor"}
                </span>
              </ResultRow>
            </CommandItem>
          )}
        </ResultGroup>

        {!hasLocal && remoteRows === 0 && (
          <EmptyState term={search.term} doctors={doctors} patients={patients} />
        )}
      </CommandList>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </Command>
  );
}

function rowCount(result: GroupResult<unknown>) {
  return result.status === "success" ? result.rows.length : 0;
}

/** The item values `ResultGroup` renders, in order. */
function resultValues(result: GroupResult<{ id: string }>, noun: string) {
  if (result.status === "error") return [`retry-${noun}`];
  if (result.status !== "success") return [];
  const values = result.rows.map((row) => `${noun}-${row.id}`);
  if (result.total > result.rows.length) values.push(`all-${noun}s`);
  return values;
}

function CommandGroupOf({ heading, commands }: { heading: string; commands: PaletteCommand[] }) {
  if (commands.length === 0) return null;
  return (
    <CommandGroup heading={heading}>
      {commands.map(({ value, label, icon: Icon, checked, run }) => (
        <CommandItem key={value} value={value} data-checked={checked} onSelect={run}>
          <Icon />
          <span>{label}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

/** Name and a short fact share the first line, so the detail line gets the full width. */
function ResultRow({
  name,
  terms,
  aside,
  children,
}: {
  name: string;
  terms: string[];
  aside: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <Avatar>
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5">
        <span className="truncate">
          <Highlight text={name} terms={terms} />
        </span>
        {aside}
        <span className="col-span-2 flex min-w-0 items-center gap-1 text-xs font-normal text-muted-foreground">
          {children}
        </span>
      </span>
    </>
  );
}

interface ResultGroupProps<T> {
  heading: string;
  noun: string;
  result: GroupResult<T>;
  onSeeAll: () => void;
  children: (row: T) => ReactNode;
}

function ResultGroup<T>({ heading, noun, result, onSeeAll, children }: ResultGroupProps<T>) {
  if (result.status === "error") {
    return (
      <CommandGroup heading={heading}>
        <CommandItem value={`retry-${noun}`} onSelect={result.retry}>
          <RotateCcwIcon />
          <span>Couldn’t search {noun}s. Select to try again.</span>
        </CommandItem>
      </CommandGroup>
    );
  }
  if (result.status !== "success" || result.rows.length === 0) return null;

  return (
    <CommandGroup
      heading={
        <span className="flex items-center justify-between gap-2">
          {heading}
          <span className="tabular">{plural(result.total, "match", "matches")}</span>
        </span>
      }
      // Earlier results dim while new ones load, but only if the wait is noticeable.
      data-stale={result.stale}
      className="transition-opacity data-[stale=true]:opacity-50 data-[stale=true]:delay-150"
    >
      {result.rows.map(children)}
      {result.total > result.rows.length && (
        <CommandItem value={`all-${noun}s`} onSelect={onSeeAll} className="text-muted-foreground">
          <ArrowRightIcon />
          <span>See all {plural(result.total, noun)}</span>
        </CommandItem>
      )}
    </CommandGroup>
  );
}

function EmptyState({
  term,
  doctors,
  patients,
}: {
  term: string;
  doctors: GroupResult<Doctor>;
  patients: GroupResult<Patient>;
}) {
  if (doctors.status === "error" || patients.status === "error") return null;

  let message: ReactNode;
  if (term.length < MIN_SEARCH_LENGTH) {
    message = <p>Keep typing to search doctors and patients.</p>;
  } else if (
    doctors.status === "success" &&
    !doctors.stale &&
    patients.status === "success" &&
    !patients.stale
  ) {
    message = (
      <>
        <p className="font-medium text-foreground">No doctors or patients match “{term}”.</p>
        <p>Search looks at the start of names, specialties, hospitals, diagnoses and phone numbers.</p>
      </>
    );
  } else {
    message = (
      <p className="flex animate-in items-center gap-2 fade-in-0 delay-150 fill-mode-both">
        <Spinner />
        Searching doctors and patients…
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 px-6 py-14 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
