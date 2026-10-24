import { mentorGuard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { usageSummary } from "@/lib/server/mentor-run";
import { cleanTzOffset } from "@/lib/mentor/periods";

// Cost (M14): GET ?tz=<getTimezoneOffset()> → Today / Month estimate in the owner's local time,
// today's question count and the 50/day warning flag (not a block).
export async function GET(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const tz = cleanTzOffset(new URL(request.url).searchParams.get("tz"));
  try {
    return Response.json({ usage: await usageSummary(g.store, new Date(), tz) });
  } catch (error) {
    return serverError(error);
  }
}
