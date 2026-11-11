import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";
export type TableId = "doctors" | "patients";

/** Column ids pinned to each side of a table, in display order. */
export interface PinnedColumns {
  start: string[];
  end: string[];
}

/** Also read by the inline script in the root layout, before React loads. */
export const PREFERENCES_KEY = "doctor-tracker:preferences";

interface Preferences {
  theme: Theme;
  density: Density;
  /** Only tables someone has changed; the rest use their own default. */
  pinnedColumns: Partial<Record<TableId, PinnedColumns>>;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  setPinnedColumns: (table: TableId, pinned: PinnedColumns) => void;
}

/**
 * Interface preferences only. Server data lives in TanStack Query and filters live in
 * the URL, so this is the one piece of global client state the app has.
 */
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      theme: "system",
      density: "comfortable",
      pinnedColumns: {},
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setPinnedColumns: (table, pinned) =>
        set((state) => ({ pinnedColumns: { ...state.pinnedColumns, [table]: pinned } })),
    }),
    {
      name: PREFERENCES_KEY,
      partialize: ({ theme, density, pinnedColumns }) => ({ theme, density, pinnedColumns }),
      // Rehydrated after mount, so the first client render matches the server's HTML.
      skipHydration: true,
    },
  ),
);
