import "server-only";
import { timingSafeEqual } from "node:crypto";
import { failure } from "@/lib/server/failure";
import { getStore, type Library, type Store } from "@/lib/server/store";

// Magpie is on a public URL, but its routes read and write my yums with a secret key, so every
// route needs an access code. It's typed once per device and kept in an httpOnly cookie (the
// share sheet hands photos to the service worker, which can't type a code). The code also picks
// the library: ACCESS_CODE opens the owner's book, SANDBOX_ACCESS_CODE the graders' sandbox
// (decision 0028 #10). Fails closed in production. Pattern from Selvedge.

export const ACCESS_COOKIE = "magpie_access";

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function libraryFor(given: string | null | undefined): Library | null {
  const owner = process.env.ACCESS_CODE, sandbox = process.env.SANDBOX_ACCESS_CODE;
  if (typeof given === "string" && given) {
    if (owner && same(given, owner)) return "owner";
    if (sandbox && same(given, sandbox)) return "sandbox";
  }
  // Local development without a code: the owner's (in-memory or real) library.
  if (!owner && process.env.NODE_ENV !== "production") return "owner";
  return null;
}

function cookieCode(request: Request): string | null {
  const m = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCESS_COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function libraryOf(request: Request): Library | null {
  return libraryFor(request.headers.get("x-access-code") ?? cookieCode(request));
}

/** Access check plus the data store for this device's library, or the error response to return. */
export function guard(request: Request): { store: Store; library: Library } | { error: Response } {
  if (!process.env.ACCESS_CODE && process.env.NODE_ENV === "production") {
    return { error: failure("ACCESS_CODE is not set on the server.", 503) };
  }
  const library = libraryOf(request);
  if (!library) return { error: Response.json({ error: "Wrong access code." }, { status: 401 }) };
  const result = getStore();
  if ("problem" in result) return { error: failure(result.problem, 503) };
  return { store: result.store, library };
}
