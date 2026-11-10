import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";

/** Also read by the inline script in the root layout, before React loads. */
export const PREFERENCES_KEY = "doctor-tracker:preferences";

interface Preferences {
  theme: Theme;
  density: Density;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
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
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
    }),
    {
      name: PREFERENCES_KEY,
      partialize: ({ theme, density }) => ({ theme, density }),
      // Rehydrated after mount, so the first client render matches the server's HTML.
      skipHydration: true,
    },
  ),
);
