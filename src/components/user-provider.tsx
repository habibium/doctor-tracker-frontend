"use client";

import { createContext, type ReactNode, use } from "react";
import type { CurrentUser } from "@/lib/session";

const UserContext = createContext<Promise<CurrentUser> | null>(null);

/**
 * Shares the server-verified user with client components. The promise is passed down
 * unresolved so the page shell renders without waiting for the session lookup.
 */
export function UserProvider({
  userPromise,
  children,
}: {
  userPromise: Promise<CurrentUser>;
  children: ReactNode;
}) {
  return <UserContext value={userPromise}>{children}</UserContext>;
}

/** Suspends until the user resolves, so callers need a Suspense boundary above them. */
export function useUser() {
  const userPromise = use(UserContext);
  if (!userPromise) throw new Error("useUser must be used inside UserProvider");
  return use(userPromise);
}

/** Hides controls a viewer cannot use. The API enforces the same rule on every request. */
export function useCanEdit() {
  return useUser().role === "admin";
}
