"use client";

import { createContext, type ReactNode, use } from "react";
import type { CurrentUser } from "@/lib/session";

const UserContext = createContext<CurrentUser | null>(null);

/** Shares the server-verified user with the client components below it. */
export function UserProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return <UserContext value={user}>{children}</UserContext>;
}

export function useUser() {
  const user = use(UserContext);
  if (!user) throw new Error("useUser must be used inside UserProvider");
  return user;
}

/** Hides controls a viewer cannot use. The API enforces the same rule on every request. */
export function useCanEdit() {
  return useUser().role === "admin";
}
