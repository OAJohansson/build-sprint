import { checkAccess } from "@/lib/server/access";
import { failure, serverError } from "@/lib/server/failure";
import { readPiece } from "@/lib/server/reader";
import { sampleFeedback } from "@/lib/sample-feedback";

// Ask for a reader: one Claude call. Without a key in development, the sample stands in so the
// app runs locally; in production that's an error instead.
export async function POST(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const prompt = typeof b?.prompt === "string" ? b.prompt.slice(0, 500) : "";
  const body = typeof b?.body === "string" ? b.body.slice(0, 20_000) : "";
  if (!prompt || !body.trim()) return Response.json({ error: "There's nothing to read yet." }, { status: 400 });
  const lastLesson = typeof b?.lastLesson === "string" ? b.lastLesson.slice(0, 200) : undefined;
  const recentLessons = Array.isArray(b?.recentLessons)
    ? b.recentLessons.filter((x): x is string => typeof x === "string").slice(0, 5).map((x) => x.slice(0, 200))
    : undefined;

  if (!process.env.ANTHROPIC_API_KEY) {
    if (process.env.NODE_ENV !== "production") return Response.json({ feedback: sampleFeedback(body) });
    return failure("ANTHROPIC_API_KEY is not set on the server.", 503);
  }
  try {
    return Response.json({ feedback: await readPiece({ prompt, body, lastLesson, recentLessons }) });
  } catch (error) {
    return serverError(error);
  }
}
