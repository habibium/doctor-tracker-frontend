"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type Theme, usePreferences } from "@/stores/preferences";

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const subscribeHydration = (onChange: () => void) =>
  usePreferences.persist.onFinishHydration(onChange);

/** Loads saved preferences after mount and keeps `<html>` in step with them. */
export function PreferencesSync() {
  const theme = usePreferences((state) => state.theme);
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => usePreferences.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    void usePreferences.persist.rehydrate();
  }, []);

  useEffect(() => {
    // Until the saved choice is loaded, the inline script's classes are the truth.
    if (!hydrated) return;
    const root = document.documentElement;
    const apply = () => {
      root.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark()));
      root.dataset.themePreference = theme;
    };
    apply();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, hydrated]);

  return null;
}

const THEMES: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

/*
 * The selected look comes from `data-theme-preference` on <html>, which the inline
 * script sets before paint, so the right option is highlighted before React loads.
 */
const SELECTED = {
  light: "in-data-[theme-preference=light]:bg-background in-data-[theme-preference=light]:text-foreground in-data-[theme-preference=light]:shadow-xs",
  dark: "in-data-[theme-preference=dark]:bg-background in-data-[theme-preference=dark]:text-foreground in-data-[theme-preference=dark]:shadow-xs",
  system:
    "in-data-[theme-preference=system]:bg-background in-data-[theme-preference=system]:text-foreground in-data-[theme-preference=system]:shadow-xs",
} satisfies Record<Theme, string>;

/** Three-way switch for the expanded sidebar. */
export function ThemeSwitch({ className }: { className?: string }) {
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);

  return (
    <RadioGroupPrimitive
      aria-label="Theme"
      value={theme}
      onValueChange={(value) => setTheme(value as Theme)}
      className={cn(
        "flex h-8 items-center gap-0.5 rounded-full bg-sidebar-accent p-0.5 dark:bg-sidebar-accent/70",
        className,
      )}
    >
      {THEMES.map(({ value, label, icon: Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger
            render={
              <RadioPrimitive.Root
                value={value}
                aria-label={label}
                className={cn(
                  "flex h-7 w-8 items-center justify-center rounded-full text-sidebar-foreground/70 transition-colors outline-none hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring [&_svg]:size-3.5",
                  SELECTED[value],
                )}
              />
            }
          >
            <Icon aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
      ))}
    </RadioGroupPrimitive>
  );
}

/** One button with a menu, for tight spaces such as the collapsed sidebar. */
export function ThemeToggle({
  className,
  side = "bottom",
  align = "end",
}: {
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}) {
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Change theme" className={className} />
        }
      >
        <SunIcon className="dark:hidden" />
        <MoonIcon className="hidden dark:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-44 min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
            {THEMES.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon />
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
