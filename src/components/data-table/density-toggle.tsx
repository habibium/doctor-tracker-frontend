"use client";

import { Rows3Icon, Rows4Icon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type Density, usePreferences } from "@/stores/preferences";

/** Row spacing for every table in the app; the choice is remembered on this device. */
export function DensityToggle() {
  const density = usePreferences((state) => state.density);
  const setDensity = usePreferences((state) => state.setDensity);

  return (
    <ToggleGroup
      variant="outline"
      aria-label="Row spacing"
      value={[density]}
      onValueChange={(value) => {
        const next = value[0] as Density | undefined;
        if (next) setDensity(next);
      }}
      className="hidden md:flex"
    >
      <ToggleGroupItem value="comfortable" aria-label="Comfortable rows">
        <Rows3Icon />
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" aria-label="Compact rows">
        <Rows4Icon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
