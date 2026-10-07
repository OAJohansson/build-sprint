import "server-only";
import { getStore, type Store } from "@/lib/server/store";

const FRIENDLY = "Something went wrong. Please try again later.";

/**
 * Log the real reason (Vercel → project → Logs) and show the user only a
 * general message: config and database details are never theirs to fix.
 */
export function failure(reason: string, status = 500) {
  console.error(`[crossfit] ${reason}`);
  return Response.json({ error: FRIENDLY }, { status });
}

// The app is public (portfolio piece) but holds personal data and spends money
// on AI, so every API route needs ACCESS_CODE. Fails closed in production.
export function checkAccess(request: Request): Response | null {
  const code = process.env.ACCESS_CODE;
  if (!code && process.env.NODE_ENV === "production") {
    return failure("ACCESS_CODE is not set on the server.", 503);
  }
  if (code && request.headers.get("x-access-code") !== code) {
    return Response.json({ error: "Wrong access code." }, { status: 401 });
  }
  return null;
}

/** Access check plus the data store, or the error response to return. */
export function guard(request: Request): { store: Store } | { error: Response } {
  const denied = checkAccess(request);
  if (denied) return { error: denied };
  const result = getStore();
  if ("problem" in result) return { error: failure(result.problem, 503) };
  return result;
}

export const serverError = (error: unknown) =>
  failure(error instanceof Error ? error.message : String(error));
