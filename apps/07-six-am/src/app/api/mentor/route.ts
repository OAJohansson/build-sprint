import { after } from "next/server";
import { mentorGuard } from "@/lib/server/access";
import { MentorError } from "@/lib/server/claude";
import { serverError } from "@/lib/server/failure";
import { ask, isFail, mentorErrorResponse, type AskBody } from "@/lib/server/mentor-run";
import { cleanTzOffset } from "@/lib/mentor/periods";

// The Mentor (decision 0027). POST { job, trackId?, message?, … } → one validated answer (the
// server builds the prompt; no audio ever); the memory rewrite runs after the response (L88).
// GET ?thread=main (default) → the one chat (L86); older per-track threads stay readable here.
// Claude with web search can take a while; the 15 s target is a median, not a cap.
export const maxDuration = 60;

export async function GET(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const thread = (new URL(request.url).searchParams.get("thread") ?? "main").slice(0, 600);
  try {
    const rows = await g.store.thread(thread, 100);
    const messages = rows
      .filter((r) => r.role === "user" || !r.content.startsWith('{"error"'))
      .map((r) => {
        const base = { id: r.id, role: r.role, job: r.job, createdAt: r.createdAt };
        if (r.role === "user") return { ...base, text: r.content };
        return { ...base, answer: JSON.parse(r.content), costUsd: r.costUsd };
      });
    return Response.json({ thread, messages });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const body = ((await request.json().catch(() => null)) ?? {}) as AskBody;
  try {
    const reply = await ask(g.store, body, new Date(), cleanTzOffset(body.tz), (fn) => after(fn));
    if (isFail(reply)) return Response.json({ error: reply.error, ...reply.extra }, { status: reply.status });
    return Response.json(reply);
  } catch (error) {
    if (error instanceof MentorError) return mentorErrorResponse(error);
    return serverError(error);
  }
}
