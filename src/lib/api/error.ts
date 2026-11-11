import type { components } from "./openapi";

type ErrorResponse = components["schemas"]["ErrorResponse"];

export interface ApiErrorDetail {
  path: string;
  message: string;
}

/** Every failed API call is thrown as this, so callers branch on `status` and `code`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const isErrorResponse = (body: unknown): body is ErrorResponse =>
  typeof body === "object" && body !== null && "error" in body;

export function toApiError(body: unknown, response: Response | undefined): ApiError {
  if (body instanceof ApiError) return body;

  if (!response) {
    return new ApiError(0, "NETWORK_ERROR", "Can't reach the server. Check your connection.");
  }
  if (isErrorResponse(body)) {
    const { code, message, details } = body.error;
    return new ApiError(response.status, code, message, details);
  }
  return new ApiError(response.status, "UNKNOWN_ERROR", "Something went wrong. Try again.");
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Try again.";
