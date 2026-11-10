"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { PreferencesSync } from "@/components/theme";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <NuqsAdapter>
        <TooltipProvider>
          <Toaster>{children}</Toaster>
        </TooltipProvider>
      </NuqsAdapter>
      <PreferencesSync />
    </QueryClientProvider>
  );
}
