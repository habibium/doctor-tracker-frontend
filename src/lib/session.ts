import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ApiContext } from "@/lib/api";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export type Role = "admin" | "viewer";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Forwards the visitor's cookies so server-side API calls run as that visitor. */
export async function apiContext(): Promise<ApiContext> {
  return { headers: { cookie: (await cookies()).toString() } };
}

/**
 * The signed-in user, verified against the API. The proxy only checks that a session
 * cookie exists; this is where a forged or expired one is caught.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  "use cache: private";

  const { headers } = await apiContext();
  const response = await fetch(`${API_URL}/api/auth/get-session`, { headers });
  const session = response.ok ? await response.json() : null;
  if (!session?.user) redirect("/login");

  const { id, name, email, role } = session.user;
  return { id, name, email, role: role === "admin" ? "admin" : "viewer" };
}
