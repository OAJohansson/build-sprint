import "server-only";
import { failure } from "@/lib/server/failure";
import { getStore, type Store } from "@/lib/server/store";

// The app is public (portfolio piece) but holds private writing and will spend money on AI,
// so every API route needs ACCESS_CODE. Fails closed in production.
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
