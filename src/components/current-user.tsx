import type { ReactNode } from "react";
import { UserMenu } from "@/components/app-shell/user-menu";
import { getCurrentUser } from "@/lib/session";

/*
 * These read the session, which is only known at request time. Each must be rendered
 * inside its own <Suspense>, so the rest of the page stays in the static shell.
 */

export async function CurrentUserMenu() {
  return <UserMenu user={await getCurrentUser()} />;
}

/** Renders its children for admins only. Viewers get nothing, not a disabled control. */
export async function AdminOnly({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return user.role === "admin" ? children : null;
}
