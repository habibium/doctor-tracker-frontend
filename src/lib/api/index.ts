import { client } from "./generated/client.gen";
import { toApiError } from "./error";

// Registered once at import, before any request: all app code imports the SDK from here.
client.interceptors.error.use((error, response) => toApiError(error, response));

export * from "./generated/sdk.gen";
export type * from "./generated/types.gen";
export { ApiError, errorMessage } from "./error";

/**
 * Extra request options for server-side calls, where the session cookie has to be
 * forwarded by hand. Browser calls send it automatically and pass nothing.
 */
export interface ApiContext {
  headers?: Record<string, string>;
}
