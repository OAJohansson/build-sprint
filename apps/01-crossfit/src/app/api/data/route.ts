import { guard, serverError } from "@/lib/server/access";

// Everything in one go: a personal log is small enough to load whole.
export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    return Response.json(await g.store.load());
  } catch (error) {
    return serverError(error);
  }
}
