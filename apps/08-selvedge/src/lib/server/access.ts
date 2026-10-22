import "server-only";
import { timingSafeEqual } from "node:crypto";
import { failure } from "@/lib/server/failure";
import { getStore, type Store } from "@/lib/server/store";

// Selvedge is on a public URL, but its routes read and write my saves with a secret key, so
// every route needs ACCESS_CODE. It's typed once per device and then kept in an httpOnly cookie,
// because the share sheet hands shares to the service worker, which can't type a code; a header
// works too (scripts, tests). Fails closed in production. Pattern from Six AM.

export const ACCESS_COOKIE = "selvedge_access";

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function codeMatches(given: string | null | undefined): boolean {
  const code = process.env.ACCESS_CODE;
  if (!code) return process.env.NODE_ENV !== "production";
  return typeof given === "string" && same(given, code);
}

function cookieCode(request: Request): string | null {
  const m = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCESS_COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function checkAccess(request: Request): Response | null {
  if (!process.env.ACCESS_CODE && process.env.NODE_ENV === "production") {
    return failure("ACCESS_CODE is not set on the server.", 503);
  }
  if (!codeMatches(request.headers.get("x-access-code") ?? cookieCode(request))) {
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
