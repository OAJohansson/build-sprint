import "server-only";
import { getStore, type Store } from "@/lib/server/store";

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
  const store = getStore();
  if (!store) {
    return { error: Response.json({ error: "Database is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY)." }, { status: 503 }) };
  }
  return { store };
}

export const serverError = (error: unknown) => {
  console.error(error);
  return Response.json({ error: "Something went wrong saving or loading. Try again." }, { status: 500 });
};
