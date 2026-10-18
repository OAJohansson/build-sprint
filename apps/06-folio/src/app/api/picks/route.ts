import { guard } from "@/lib/server/access";
import { failure, serverError } from "@/lib/server/failure";
import { recommend } from "@/lib/server/recommend";

// Home's "Folio's picks": ten books Claude chose from my shelf, each checked on Open Library.
// The first call for a new shelf takes 10–30 s (Claude, then Open Library); repeats are cached.
export const maxDuration = 60;

export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  if (!process.env.ANTHROPIC_API_KEY) return failure("ANTHROPIC_API_KEY is not set", 503);
  try {
    return Response.json({ picks: await recommend(await g.store.list()) });
  } catch (error) {
    return serverError(error);
  }
}
