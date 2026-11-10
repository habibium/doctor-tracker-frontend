import type { CreateClientConfig } from "./generated/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  // Browser requests stay same-origin and reach the API through the Next.js rewrite,
  // which keeps the session cookie first-party. Server components call the API directly.
  baseUrl: typeof window === "undefined" ? (process.env.API_URL ?? "http://localhost:4000") : "",
});
