import "server-only";
import { failure } from "@/lib/server/failure";
import { getMentorStore, type MentorStore } from "@/lib/server/mentor-store";
import { getStore, type Store } from "@/lib/server/store";
import { getLoopStore, type LoopStore } from "@/lib/server/ai-loops/store";
import { getLibraryStore, type LibraryStore } from "@/lib/server/library-store";

// Six AM is on a public URL, but its routes read and write my tracks with a secret key, so every
// route needs ACCESS_CODE. Fails closed in production. Pattern from Scribble and Folio.
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

/** Access check plus the Mentor's data store (decision 0027), or the error response to return. */
export function mentorGuard(request: Request): { store: MentorStore } | { error: Response } {
  const denied = checkAccess(request);
  if (denied) return { error: denied };
  const result = getMentorStore();
  if ("problem" in result) return { error: failure(result.problem, 503) };
  return result;
}

/** Access check plus the AI loops store (S4), or the error response to return. */
export function loopGuard(request: Request): { store: LoopStore } | { error: Response } {
  const denied = checkAccess(request);
  if (denied) return { error: denied };
  const result = getLoopStore();
  if ("problem" in result) return { error: failure(result.problem, 503) };
  return result;
}

/** Access check plus the sound library store (Lab S4), or the error response to return. */
export function libraryGuard(request: Request): { store: LibraryStore } | { error: Response } {
  const denied = checkAccess(request);
  if (denied) return { error: denied };
  const result = getLibraryStore();
  if ("problem" in result) return { error: failure(result.problem, 503) };
  return result;
}
