import "server-only";
import { timingSafeEqual } from "node:crypto";
import { failure } from "@/lib/server/failure";
import { getStore, type Space, type Store } from "@/lib/server/store";

// Wont is on a public URL and its sync route reads and writes my habits with a secret key, so it
// needs an access code (L27). It's typed once per device and kept in an httpOnly cookie; a header
// works too (scripts, tests). The code also picks the document: ACCESS_CODE opens the owner's,
// SANDBOX_ACCESS_CODE the graders' sandbox (decision 0028). Fails closed in production.
// Pattern from Selvedge and Magpie.

export const ACCESS_COOKIE = "wont_access";

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function spaceFor(given: string | null | undefined): Space | null {
  const owner = process.env.ACCESS_CODE, sandbox = process.env.SANDBOX_ACCESS_CODE;
  if (typeof given === "string" && given) {
    if (owner && same(given, owner)) return "owner";
    if (sandbox && same(given, sandbox)) return "sandbox";
  }
  // Local development without a code: the owner's (in-memory or real) document.
  if (!owner && process.env.NODE_ENV !== "production") return "owner";
  return null;
}

function cookieCode(request: Request): string | null {
  const m = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${ACCESS_COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function spaceOf(request: Request): Space | null {
  return spaceFor(request.headers.get("x-access-code") ?? cookieCode(request));
}

/** Access check plus the store for this device's space, or the error response to return. */
export function guard(request: Request): { store: Store; space: Space } | { error: Response } {
  if (!process.env.ACCESS_CODE && process.env.NODE_ENV === "production") {
    return { error: failure("ACCESS_CODE is not set on the server.", 503) };
  }
  const space = spaceOf(request);
  if (!space) return { error: Response.json({ error: "Wrong access code." }, { status: 401 }) };
  const result = getStore();
  if ("problem" in result) return { error: failure(result.problem, 503) };
  return { store: result.store, space };
}
