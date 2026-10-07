import "server-only";
import { StoreError, getStore, type Store } from "@/lib/server/store";

// The app is public (portfolio piece) but holds personal data and spends money
// on AI, so every API route needs ACCESS_CODE. Fails closed in production.
export function checkAccess(request: Request): Response | null {
  const code = process.env.ACCESS_CODE;
  if (!code && process.env.NODE_ENV === "production") {
    return Response.json({ error: "ACCESS_CODE is not set on the server." }, { status: 503 });
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
  if ("problem" in result) return { error: Response.json({ error: result.problem }, { status: 503 }) };
  return result;
}

export const serverError = (error: unknown) => {
  console.error(error);
  // Database problems carry a plain-language reason; show it rather than a generic message.
  const message = error instanceof StoreError ? error.message : "Something went wrong saving or loading. Try again.";
  return Response.json({ error: message }, { status: 500 });
};
