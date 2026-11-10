import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Talks to /api/auth on this origin, which the Next.js rewrite forwards to the API. */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({ user: { role: { type: "string", input: false } } })],
});
