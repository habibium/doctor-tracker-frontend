"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(key: string, text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.add({ title: `${label} copied` });
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 2000);
    } catch {
      toast.add({ type: "error", title: "Couldn't copy", description: "Select the text and copy it instead." });
    }
  }

  return { copied, copy };
}
